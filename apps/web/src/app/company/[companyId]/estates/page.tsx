import { getServerApiClient } from "@/utils/server-orpc";
import { connection } from "next/server";
import { EstateRegistry } from "@/components/company/estate-registry";

export default async function EstatesPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await connection();

  try {
    const client = await getServerApiClient();
    const estates = await client.land.listCompanyEstates({ companyId });

    return <EstateRegistry companyId={companyId} initialEstates={estates} />;
  } catch {
    return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Estate inventory could not be loaded. Confirm your company is approved and try again.</div>;
  }
}
