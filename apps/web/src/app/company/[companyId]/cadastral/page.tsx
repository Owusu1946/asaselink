import { CadastralRecords, type CadastralRecord } from "@/components/company/cadastral-records";
import { getServerApiClient } from "@/utils/server-orpc";

export default async function CadastralPage({ params, searchParams }: { params: Promise<{ companyId: string }>; searchParams: Promise<{ estate?: string }> }) {
  const [{ companyId }, query] = await Promise.all([params, searchParams]);
  const api = await getServerApiClient();
  const [estates, records] = await Promise.all([api.land.listCompanyEstates({ companyId }), api.land.listCadastralRecords({ companyId, estateId: query.estate })]);
  return <CadastralRecords companyId={companyId} selectedEstateId={query.estate} estates={estates} records={records as unknown as CadastralRecord[]} />;
}
