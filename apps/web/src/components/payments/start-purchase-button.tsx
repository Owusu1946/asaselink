"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

export function StartPurchaseButton({ reservationReference, label = "Continue purchase" }: { reservationReference: string; label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Button size="sm" disabled={pending} onClick={() => startTransition(async () => {
    try {
      const purchase = await client.purchases.start({ reservationReference });
      router.push(`/account/purchases/${String(purchase.reference)}`);
    } catch (error) { notify.apiError(error, "Purchase could not be opened"); }
  })}>{pending ? "Opening…" : label}</Button>;
}
