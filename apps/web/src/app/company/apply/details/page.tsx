"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CompanyOnboardingShell } from "@/components/company/company-onboarding-shell";
import { Input } from "@asaselink/ui/components/input";
import { Label } from "@asaselink/ui/components/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";

function DetailsContent() {
  const router = useRouter();

  const [legalName, setLegalName] = React.useState("");
  const [tradeName, setTradeName] = React.useState("");
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [taxNumber, setTaxNumber] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [address, setAddress] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Prepopulate draft if exists
  React.useEffect(() => {
    let isMounted = true;
    orpc.company.getApplication
      .call()
      .then((data) => {
        if (!isMounted || !data?.company) return;
        setLegalName(data.company.legalName || "");
        setTradeName(data.company.tradeName || "");
        setRegistrationNumber(data.company.registrationNumber || "");
        setTaxNumber(data.company.taxNumber || "");
        setEmail(data.company.email || "");
        setPhone(data.company.phone || "");
        setWebsite(data.company.website || "");
        setAddress(data.company.address || "");
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNext = async () => {
    setError(null);

    if (!legalName.trim()) {
      setError("Please enter your legal business name.");
      return;
    }
    if (!registrationNumber.trim()) {
      setError("Please enter your business registration number.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid business email.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter a valid phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await orpc.company.saveDetails.call({
        legalName: legalName.trim(),
        tradeName: tradeName.trim() || undefined,
        registrationNumber: registrationNumber.trim(),
        taxNumber: taxNumber.trim() || undefined,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        website: website.trim() || undefined,
        address: address.trim() || undefined,
      });

      router.push("/company/apply/representative");
    } catch (err: unknown) {
      console.error("Failed to save details:", err);
      setError(err instanceof Error ? err.message : "Could not save company details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CompanyOnboardingShell
      currentStep={1}
      title="Tell us about your company"
      subtitle="Enter your official business information to begin listing estates."
      onNext={handleNext}
      isSubmitting={isSubmitting}
      nextLabel="Continue"
    >
      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive"
          >
            <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="legal-name" className="text-xs font-semibold text-foreground">
              Legal business name
            </Label>
            <Input
              id="legal-name"
              type="text"
              required
              disabled={isSubmitting}
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Asase Estates Limited"
              className="h-12 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trade-name" className="text-xs font-semibold text-foreground">
              Brand / Estate name <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="trade-name"
              type="text"
              disabled={isSubmitting}
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="e.g. Asase Hills"
              className="h-12 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reg-num" className="text-xs font-semibold text-foreground">
                Registration number
              </Label>
              <Input
                id="reg-num"
                type="text"
                required
                disabled={isSubmitting}
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. CS12345678"
                className="h-12 rounded-xl text-sm font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tax-num" className="text-xs font-semibold text-foreground">
                Tax number <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="tax-num"
                type="text"
                disabled={isSubmitting}
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="e.g. C0012345678"
                className="h-12 rounded-xl text-sm font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                Business email
              </Label>
              <Input
                id="email"
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@company.com"
                className="h-12 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                Phone number
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                disabled={isSubmitting}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 24 000 0000"
                className="h-12 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-foreground">
              Office address <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="address"
              type="text"
              disabled={isSubmitting}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Airport Residential Area, Accra"
              className="h-12 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-xs font-semibold text-foreground">
              Website <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="website"
              type="url"
              disabled={isSubmitting}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://company.com"
              className="h-12 rounded-xl text-sm"
            />
          </div>
        </div>
      </div>
    </CompanyOnboardingShell>
  );
}

export default function CompanyApplyDetailsPage() {
  return (
    <ApiProvider clerkEnabled>
      <DetailsContent />
    </ApiProvider>
  );
}
