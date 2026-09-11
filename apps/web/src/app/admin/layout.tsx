import ApiProvider from "@/components/api-provider";
import { AdminNav } from "@/components/dashboard/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ApiProvider clerkEnabled><AdminNav /><div className="min-h-svh bg-background pt-16 lg:pl-64 lg:pt-0">{children}</div></ApiProvider>;
}
