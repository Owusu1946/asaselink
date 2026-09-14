import { notFound } from "next/navigation";
import { PaymentCheckout } from "@/components/payments/payment-checkout";
import { getServerApiClient } from "@/utils/server-orpc";

export default async function PaymentPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const api = await getServerApiClient();
  let checkout: Record<string, unknown>;
  try { checkout = await api.payments.checkout({ reservationReference: reference }) as Record<string, unknown>; }
  catch { notFound(); }
  return <PaymentCheckout checkout={checkout} />;
}
