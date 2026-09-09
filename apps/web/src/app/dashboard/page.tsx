import { env } from "@asaselink/env/web";

import DashboardWithClerk from "@/components/dashboard-with-clerk";

export default function Dashboard() {
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Add a Clerk publishable key to enable account features in this environment.
        </p>
      </main>
    );
  }

  return <DashboardWithClerk />;
}
