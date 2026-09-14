import { AdminFinance } from "@/components/payments/admin-finance";
import { getServerApiClient } from "@/utils/server-orpc";

export default async function AdminFinancePage() {
  const api = await getServerApiClient();
  const queue = await api.payments.adminQueue();
  return <main className="mx-auto max-w-7xl space-y-7 p-5 sm:p-8"><AdminFinance initialQueue={queue as { payments: Record<string, unknown>[]; payouts: Record<string, unknown>[] }} /></main>;
}
