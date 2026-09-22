import { CompanyFinance } from "@/components/payments/company-finance";
import { getServerApiClient } from "@/utils/server-orpc";
import { CompanyReceivables } from "@/components/payments/company-receivables";

export default async function CompanyFinancePage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const api = await getServerApiClient();
  const [summary, purchases] = await Promise.all([api.payments.companySummary({ companyId }), api.purchases.listCompany({ companyId })]);
  return <div className="space-y-8"><CompanyFinance companyId={companyId} initialSummary={summary as { balance: Record<string, unknown>; payments: Record<string, unknown>[]; payouts: Record<string, unknown>[] }} /><CompanyReceivables purchases={purchases as Record<string, unknown>[]} /></div>;
}
