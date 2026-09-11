import ApiProvider from "@/components/api-provider";
import { AdminPageShell } from "@/components/dashboard/admin-page-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ApiProvider clerkEnabled><AdminPageShell>{children}</AdminPageShell></ApiProvider>;
}
