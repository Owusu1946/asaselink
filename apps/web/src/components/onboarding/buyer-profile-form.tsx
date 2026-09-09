"use client";

import * as React from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@asaselink/ui/components/button";
import { Input } from "@asaselink/ui/components/input";
import { Label } from "@asaselink/ui/components/label";
import { Checkbox } from "@asaselink/ui/components/checkbox";
import { Spinner } from "@asaselink/ui/components/spinner";
import { AlertCircle, CheckCircle2, ShieldCheck, LogOut } from "lucide-react";
import { orpc } from "@/utils/orpc";

export function BuyerProfileForm() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnUrl = searchParams?.get("return_url") || "/account";

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [consent, setConsent] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize fields from Clerk user
  React.useEffect(() => {
    if (!user) return;
    if (user.firstName && !firstName) setFirstName(user.firstName);
    if (user.lastName && !lastName) setLastName(user.lastName);
    if (user.primaryPhoneNumber?.phoneNumber && !phone) {
      setPhone(user.primaryPhoneNumber.phoneNumber);
    }
  }, [user, firstName, lastName, phone]);

  const verifiedEmail = user?.primaryEmailAddress?.emailAddress || "Verified email";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError("Please provide your first name.");
      return;
    }
    if (!lastName.trim()) {
      setError("Please provide your last name.");
      return;
    }

    let normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      setError("Please provide your mobile contact number.");
      return;
    }

    // Format phone to Ghana standard if not already E.164
    const cleaned = normalizedPhone.replace(/[\s\-()]/g, "");
    if (/^0\d{9}$/.test(cleaned)) {
      normalizedPhone = `+233${cleaned.slice(1)}`;
    } else if (/^\d{9}$/.test(cleaned)) {
      normalizedPhone = `+233${cleaned}`;
    } else if (/^233\d{9}$/.test(cleaned)) {
      normalizedPhone = `+${cleaned}`;
    }

    setIsSubmitting(true);
    try {
      await orpc.auth.updateBuyerProfile.call({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: normalizedPhone,
        communicationConsent: consent,
      });

      router.replace(returnUrl);
    } catch (err: unknown) {
      console.error("Failed to save profile:", err);
      // Fallback redirect to account
      router.replace(returnUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center p-8">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context info banner */}
      <div className="rounded-xl border border-brand-green-200 bg-brand-green-50/60 p-3.5 text-xs text-brand-green-900 dark:border-brand-green-900 dark:bg-brand-green-950/40 dark:text-brand-green-200">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="size-4 text-brand-green-700 dark:text-brand-green-400" />
          <span>Identity verified &middot; Land title readiness</span>
        </div>
        <p className="mt-1 text-muted-foreground">
          Confirm your legal details for reservation certificates and official land documentation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle className="size-4 shrink-0 translate-y-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Name inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="buyer-first-name" className="text-xs font-medium text-foreground">
              First name
            </Label>
            <Input
              id="buyer-first-name"
              type="text"
              autoComplete="given-name"
              required
              disabled={isSubmitting}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Kwame"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="buyer-last-name" className="text-xs font-medium text-foreground">
              Last name
            </Label>
            <Input
              id="buyer-last-name"
              type="text"
              autoComplete="family-name"
              required
              disabled={isSubmitting}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Mensah"
              className="h-10"
            />
          </div>
        </div>

        {/* Verified Email Display */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">Verified email address</Label>
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3.5 py-2 text-xs text-foreground">
            <span className="font-mono text-muted-foreground">{verifiedEmail}</span>
            <span className="inline-flex items-center gap-1 font-medium text-brand-green-700 dark:text-brand-green-400">
              <CheckCircle2 className="size-3.5" />
              Verified
            </span>
          </div>
        </div>

        {/* Phone number */}
        <div className="space-y-1.5">
          <Label htmlFor="buyer-phone" className="text-xs font-medium text-foreground">
            Ghana phone number
          </Label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground select-none pointer-events-none">
              <span>🇬🇭</span>
              <span>+233</span>
            </div>
            <Input
              id="buyer-phone"
              type="tel"
              autoComplete="tel"
              required
              disabled={isSubmitting}
              value={phone.startsWith("+233") ? phone.slice(4) : phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="024 123 4567"
              className="h-10 pl-20 tabular-nums"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Used for urgent plot status and reservation receipt notifications.
          </p>
        </div>

        {/* Consent Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <Checkbox
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
              disabled={isSubmitting}
              className="mt-0.5"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I authorize AsaseLink to send transactional reservation updates and Cadastral survey
              confirmations to my email and phone.
            </span>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-3">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="w-full font-medium"
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4" />
                <span>Saving profile...</span>
              </>
            ) : (
              "Complete profile and continue"
            )}
          </Button>
        </div>
      </form>

      {/* Account switch link */}
      <div className="border-t border-border pt-4 text-center">
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="size-3.5" />
          <span>Signed in as wrong account? Sign out</span>
        </button>
      </div>
    </div>
  );
}
