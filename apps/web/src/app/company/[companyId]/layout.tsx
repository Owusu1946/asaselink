import ApiProvider from "@/components/api-provider";
import { CompanyWorkspaceShell } from "@/components/dashboard/company-page-shell";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <ApiProvider clerkEnabled><CompanyWorkspaceShell>{children}</CompanyWorkspaceShell></ApiProvider>;
}
