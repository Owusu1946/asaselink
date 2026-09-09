export default function BuyerAccountLoading() {
  return (
    <div className="min-h-svh bg-background p-6 sm:p-10 space-y-6">
      <div className="h-10 w-48 rounded-xl bg-muted animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 rounded-2xl bg-muted/60 animate-pulse" />
        <div className="h-32 rounded-2xl bg-muted/60 animate-pulse" />
        <div className="h-32 rounded-2xl bg-muted/60 animate-pulse" />
      </div>
      <div className="h-64 rounded-2xl bg-muted/40 animate-pulse" />
    </div>
  );
}
