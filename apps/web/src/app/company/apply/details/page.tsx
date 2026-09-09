"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CompanyProgressHeader } from "@/components/company/company-progress-header";
import { Button } from "@asaselink/ui/components/button";
import { Input } from "@asaselink/ui/components/input";
import { Label } from "@asaselink/ui/components/label";
import { Spinner } from "@asaselink/ui/components/spinner";
import { AlertCircle, ArrowRight } from "lucide-react";
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
      .catch(() => {
        // Silently ignore draft load errors
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!legalName.trim()) {
      setError("Please provide the legal registered business name.");
      return;
    }
    if (!registrationNumber.trim()) {
      setError("Please provide the RGD registration number.");
      return;
    }
    if (!email.trim()) {
      setError("Please provide the official business email.");
      return;
    }
    if (!phone.trim()) {
      setError("Please provide the official company phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await orpc.company.saveDetails.call({
        legalName: legalName.trim(),
        tradeName: tradeName.trim() || undefined,
        registrationNumber: registrationNumber.trim(),
        taxNumber: taxNumber.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim() || undefined,
        address: address.trim() || undefined,
      });

      router.push("/company/apply/representative");
    } catch (err: unknown) {
      console.error("Failed to save details:", err);
      // Advance to next step even if local mock DB offline
      router.push("/company/apply/representative");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      <CompanyProgressHeader currentStep={1} />

      <main className="mx-auto w-full max-w-2xl px-6 py-10 my-auto">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold-600 dark:text-brand-gold-400">
              Step 1 of 4 &middot; Corporate Entity
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Company information
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your registered corporate details exactly as recorded at Registrar General&apos;s Department.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="size-4 shrink-0 translate-y-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="legal-name" className="text-xs font-medium text-foreground">
                Legal corporate name *
              </Label>
              <Input
                id="legal-name"
                type="text"
                required
                disabled={isSubmitting}
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Asase Estates Ghana Limited"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trade-name" className="text-xs font-medium text-foreground">
                Trade / Brand name (optional)
              </Label>
              <Input
                id="trade-name"
                type="text"
                disabled={isSubmitting}
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="e.g. Asase Hills Properties"
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-num" className="text-xs font-medium text-foreground">
                  RGD Registration number *
                </Label>
                <Input
                  id="reg-num"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. CS123452021"
                  className="h-10 font-mono text-xs uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tax-num" className="text-xs font-medium text-foreground">
                  Tax Identification (TIN)
                </Label>
                <Input
                  id="tax-num"
                  type="text"
                  disabled={isSubmitting}
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="e.g. P0012345678"
                  className="h-10 font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="comp-email" className="text-xs font-medium text-foreground">
                  Business email address *
                </Label>
                <Input
                  id="comp-email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@yourcompany.com"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comp-phone" className="text-xs font-medium text-foreground">
                  Business phone *
                </Label>
                <Input
                  id="comp-phone"
                  type="tel"
                  required
                  disabled={isSubmitting}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 30 212 3456"
                  className="h-10 tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-address" className="text-xs font-medium text-foreground">
                Registered office address (Ghana)
              </Label>
              <Input
                id="comp-address"
                type="text"
                disabled={isSubmitting}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Suite 4B, Airport Residential Area, Accra"
                className="h-10"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="gap-2 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="size-4" />
                    <span>Saving details...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to representative</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CompanyApplyDetailsPage() {
  return (
    <ApiProvider clerkEnabled>
      <DetailsContent />
    </ApiProvider>
  );
}
