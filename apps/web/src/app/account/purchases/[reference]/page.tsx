import { PurchaseDetail } from "@/components/payments/purchase-detail";
import { getServerApiClient } from "@/utils/server-orpc";

export default async function PurchasePage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const api = await getServerApiClient();
  const data = await api.purchases.detail({ purchaseReference: reference });
  return <PurchaseDetail data={data as { account: Record<string, unknown>; entries: Record<string, unknown>[]; payments: Record<string, unknown>[] }} />;
}
