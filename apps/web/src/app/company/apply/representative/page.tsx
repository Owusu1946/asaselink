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

  const handleNext = async () => {
    setError(null);

    if (!repFullName.trim()) {
      setError("Please enter the representative's full legal name.");
      return;
    }
    if (!repRole.trim()) {
      setError("Please specify their role.");
      return;
    }
    if (!repEmail.trim() || !repEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!repPhone.trim()) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!repIdNumber.trim()) {
      setError("Please enter the identification number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await orpc.company.saveRepresentative.call({
        repFullName: repFullName.trim(),
        repRole: repRole.trim(),
        repEmail: repEmail.trim().toLowerCase(),
        repPhone: repPhone.trim(),
        repIdType,
        repIdNumber: repIdNumber.trim().toUpperCase(),
      });

      router.push("/company/apply/documents");
    } catch (err: unknown) {
      console.error("Failed to save representative:", err);
      setError(err instanceof Error ? err.message : "Could not save representative details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CompanyOnboardingShell
      currentStep={2}
      title="Who is the primary representative?"
      subtitle="Add the contact details of the authorized officer managing this account."
      backHref="/company/apply/details"
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
            <Label htmlFor="rep-name" className="text-xs font-semibold text-foreground">
              Full legal name
            </Label>
            <Input
              id="rep-name"
              type="text"
              required
              disabled={isSubmitting}
              value={repFullName}
              onChange={(e) => setRepFullName(e.target.value)}
              placeholder="e.g. Kwame Mensah"
              className="h-12 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rep-role" className="text-xs font-semibold text-foreground">
              Official title / role
            </Label>
            <Input
              id="rep-role"
              type="text"
              required
              disabled={isSubmitting}
              value={repRole}
              onChange={(e) => setRepRole(e.target.value)}
              placeholder="e.g. Managing Director, CEO, Legal Counsel"
              className="h-12 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="id-type" className="text-xs font-semibold text-foreground">
                ID type
              </Label>
              <select
                id="id-type"
                value={repIdType}
                onChange={(e) => setRepIdType(e.target.value)}
                disabled={isSubmitting}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Ghana Card">Ghana Card</option>
                <option value="Passport">Passport</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="id-num" className="text-xs font-semibold text-foreground">
                ID number
              </Label>
              <Input
                id="id-num"
                type="text"
                required
                disabled={isSubmitting}
                value={repIdNumber}
                onChange={(e) => setRepIdNumber(e.target.value.toUpperCase())}
                placeholder="e.g. GHA-123456789-0"
                className="h-12 rounded-xl text-sm font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rep-email" className="text-xs font-semibold text-foreground">
                Representative email
              </Label>
              <Input
                id="rep-email"
                type="email"
                required
                disabled={isSubmitting}
                value={repEmail}
                onChange={(e) => setRepEmail(e.target.value)}
                placeholder="officer@company.com"
                className="h-12 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rep-phone" className="text-xs font-semibold text-foreground">
                Direct phone number
              </Label>
              <Input
                id="rep-phone"
                type="tel"
                required
                disabled={isSubmitting}
                value={repPhone}
                onChange={(e) => setRepPhone(e.target.value)}
                placeholder="+233 24 000 0000"
                className="h-12 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </CompanyOnboardingShell>
  );
}

export default function CompanyApplyRepresentativePage() {
  return (
    <ApiProvider clerkEnabled>
      <RepresentativeContent />
    </ApiProvider>
  );
}
