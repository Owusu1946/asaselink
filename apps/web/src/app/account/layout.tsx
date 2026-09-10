import ApiProvider from "@/components/api-provider";
import { AccountWorkspaceShell } from "@/components/dashboard/account-page-shell";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <ApiProvider clerkEnabled><AccountWorkspaceShell>{children}</AccountWorkspaceShell></ApiProvider>;
}
