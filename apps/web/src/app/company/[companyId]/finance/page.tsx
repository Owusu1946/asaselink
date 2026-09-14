import { CompanyFinance } from "@/components/payments/company-finance";
import { getServerApiClient } from "@/utils/server-orpc";

export default async function CompanyFinancePage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const api = await getServerApiClient();
  const summary = await api.payments.companySummary({ companyId });
  return <CompanyFinance companyId={companyId} initialSummary={summary as { balance: Record<string, unknown>; payments: Record<string, unknown>[]; payouts: Record<string, unknown>[] }} />;
}
