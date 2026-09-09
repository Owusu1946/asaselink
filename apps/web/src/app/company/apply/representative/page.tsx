"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CompanyProgressHeader } from "@/components/company/company-progress-header";
import { Button } from "@asaselink/ui/components/button";
import { Input } from "@asaselink/ui/components/input";
import { Label } from "@asaselink/ui/components/label";
import { Spinner } from "@asaselink/ui/components/spinner";
import { AlertCircle, ArrowLeft, ArrowRight, UserCheck } from "lucide-react";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";

function RepresentativeContent() {
  const router = useRouter();

  const [repFullName, setRepFullName] = React.useState("");
  const [repRole, setRepRole] = React.useState("Managing Director");
  const [repEmail, setRepEmail] = React.useState("");
  const [repPhone, setRepPhone] = React.useState("");
  const [repIdType, setRepIdType] = React.useState("Ghana Card");
  const [repIdNumber, setRepIdNumber] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Prepopulate draft if exists
  React.useEffect(() => {
    let isMounted = true;
    orpc.company.getApplication
      .call()
      .then((data) => {
        if (!isMounted || !data?.application) return;
        if (data.application.repFullName) setRepFullName(data.application.repFullName);
        if (data.application.repRole) setRepRole(data.application.repRole);
        if (data.application.repEmail) setRepEmail(data.application.repEmail);
        if (data.application.repPhone) setRepPhone(data.application.repPhone);
        if (data.application.repIdType) setRepIdType(data.application.repIdType);
        if (data.application.repIdNumber) setRepIdNumber(data.application.repIdNumber);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!repFullName.trim()) {
      setError("Please provide the representative's full legal name.");
      return;
    }
    if (!repRole.trim()) {
      setError("Please specify the representative's corporate role.");
      return;
    }
    if (!repEmail.trim()) {
      setError("Please provide the representative's direct email.");
      return;
    }
    if (!repPhone.trim()) {
      setError("Please provide the representative's direct mobile number.");
      return;
    }
    if (!repIdNumber.trim()) {
      setError("Please provide the national ID number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await orpc.company.saveRepresentative.call({
        repFullName: repFullName.trim(),
        repRole: repRole.trim(),
        repEmail: repEmail.trim(),
        repPhone: repPhone.trim(),
        repIdType,
        repIdNumber: repIdNumber.trim().toUpperCase(),
      });

      router.push("/company/apply/documents");
    } catch (err: unknown) {
      console.error("Failed to save representative:", err);
      router.push("/company/apply/documents");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      <CompanyProgressHeader currentStep={2} />

      <main className="mx-auto w-full max-w-2xl px-6 py-10 my-auto">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold-600 dark:text-brand-gold-400">
              Step 2 of 4 &middot; Authorized Officer
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Company representative
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Identify the primary executive officer or legal counsel accountable for land listings and customer declarations.
            </p>
          </div>

          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            <UserCheck className="size-4 text-brand-green-700 dark:text-brand-green-400 shrink-0 mt-0.5" />
            <p>
              This individual will be authorized to execute estate plot declarations and sign digital reservation certificates.
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
              <Label htmlFor="rep-name" className="text-xs font-medium text-foreground">
                Representative full name *
              </Label>
              <Input
                id="rep-name"
                type="text"
                required
                disabled={isSubmitting}
                value={repFullName}
                onChange={(e) => setRepFullName(e.target.value)}
                placeholder="e.g. Nana Yaw Osei"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rep-role" className="text-xs font-medium text-foreground">
                Corporate capacity / Title *
              </Label>
              <Input
                id="rep-role"
                type="text"
                required
                disabled={isSubmitting}
                value={repRole}
                onChange={(e) => setRepRole(e.target.value)}
                placeholder="e.g. Managing Director / Principal Partner"
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rep-email" className="text-xs font-medium text-foreground">
                  Direct email address *
                </Label>
                <Input
                  id="rep-email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  placeholder="nana@yourcompany.com"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rep-phone" className="text-xs font-medium text-foreground">
                  Direct mobile number *
                </Label>
                <Input
                  id="rep-phone"
                  type="tel"
                  required
                  disabled={isSubmitting}
                  value={repPhone}
                  onChange={(e) => setRepPhone(e.target.value)}
                  placeholder="+233 24 123 4567"
                  className="h-10 tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="id-type" className="text-xs font-medium text-foreground">
                  Identity document type *
                </Label>
                <select
                  id="id-type"
                  value={repIdType}
                  onChange={(e) => setRepIdType(e.target.value)}
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <option value="Ghana Card">Ghana Card (NIA)</option>
                  <option value="Passport">Ghana Passport</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="id-number" className="text-xs font-medium text-foreground">
                  Identification number *
                </Label>
                <Input
                  id="id-number"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={repIdNumber}
                  onChange={(e) => setRepIdNumber(e.target.value)}
                  placeholder="e.g. GHA-712345678-9"
                  className="h-10 font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                onClick={() => router.push("/company/apply/details")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                <span>Back to details</span>
              </Button>

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
                    <span>Saving representative...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to documents</span>
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

export default function CompanyApplyRepresentativePage() {
  return (
    <ApiProvider clerkEnabled>
      <RepresentativeContent />
    </ApiProvider>
  );
}
