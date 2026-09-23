export function CompanyReceivables({ purchases }: { purchases: Record<string, unknown>[] }) {
  const outstanding = purchases.reduce((sum, purchase) => sum + Number(purchase.outstanding), 0);
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Purchase receivables</h2>
          <p className="text-sm text-muted-foreground">Installments and balances owed by buyers.</p>
        </div>
        <p className="font-semibold">GHS {outstanding.toLocaleString()} outstanding</p>
      </div>
      {purchases.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="p-4">Purchase</th>
                <th className="p-4">Buyer</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Outstanding</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={String(purchase.reference)} className="border-t border-border">
                  <td className="p-4">
                    <p className="font-semibold">
                      {String(purchase.estateName)} · {String(purchase.plotNumber)}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {String(purchase.reference)}
                    </p>
                  </td>
                  <td className="p-4">{String(purchase.buyerEmail)}</td>
                  <td className="p-4">GHS {Number(purchase.netPaid).toLocaleString()}</td>
                  <td className="p-4 font-semibold">
                    GHS {Number(purchase.outstanding).toLocaleString()}
                  </td>
                  <td className="p-4 text-xs">{String(purchase.status).replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No purchase accounts yet.
        </div>
      )}
    </section>
  );
}
