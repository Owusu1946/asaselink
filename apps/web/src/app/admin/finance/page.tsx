import { AdminFinance } from "@/components/payments/admin-finance";
import { getServerApiClient } from "@/utils/server-orpc";
import { AdminPurchaseAccounting } from "@/components/payments/admin-purchase-accounting";

export default async function AdminFinancePage() {
  const api = await getServerApiClient();
  const [queue, purchases] = await Promise.all([api.payments.adminQueue(), api.purchases.adminList()]);
  return <main className="mx-auto max-w-7xl space-y-10 p-5 sm:p-8"><AdminFinance initialQueue={queue as { payments: Record<string, unknown>[]; payouts: Record<string, unknown>[] }} /><AdminPurchaseAccounting initialPurchases={purchases as Record<string, unknown>[]} /></main>;
}
