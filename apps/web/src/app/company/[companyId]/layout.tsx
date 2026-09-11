import ApiProvider from "@/components/api-provider";
import { CompanyWorkspaceShell } from "@/components/dashboard/company-page-shell";
import { getServerApiClient } from "@/utils/server-orpc";
import { connection } from "next/server";

export default async function CompanyLayout({ children, params }: { children: React.ReactNode; params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await connection();
  let initialSummary = null;
  try {
    const api = await getServerApiClient();
    initialSummary = await api.company.getWorkspaceSummary({ companyId });
  } catch { /* The shell renders a recoverable state and retries client-side. */ }
  return <ApiProvider clerkEnabled><CompanyWorkspaceShell initialSummary={initialSummary}>{children}</CompanyWorkspaceShell></ApiProvider>;
}
