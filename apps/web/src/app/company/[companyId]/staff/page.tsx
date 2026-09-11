import { getServerApiClient } from "@/utils/server-orpc";
import { CompanyTeam } from "@/components/company/company-team";
import { connection } from "next/server";

export default async function StaffPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await connection();
  try {
    const client = await getServerApiClient();
    return <CompanyTeam companyId={companyId} initialData={await client.team.list({ companyId })} />;
  } catch {
    return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Your team could not be loaded. Confirm that this company is approved and that you have workspace access.</div>;
  }
}
