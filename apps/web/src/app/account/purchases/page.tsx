import Link from "next/link";
import { getServerApiClient } from "@/utils/server-orpc";

export default async function PurchasesPage() {
  const api = await getServerApiClient();
  const purchases = (await api.purchases.listMine()) as Record<string, unknown>[];
  return (
    <div className="grid gap-4">
      {purchases.length ? (
        purchases.map((purchase) => (
          <Link
            key={String(purchase.reference)}
            href={`/account/purchases/${String(purchase.reference)}`}
            className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{String(purchase.estateName)}</p>
                <h2 className="mt-1 text-lg font-semibold">Plot {String(purchase.plotNumber)}</h2>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {String(purchase.reference)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  GHS {Number(purchase.outstanding).toLocaleString()} due
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {String(purchase.status).replaceAll("_", " ")}
                </p>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No purchases in progress.
        </div>
      )}
    </div>
  );
}
