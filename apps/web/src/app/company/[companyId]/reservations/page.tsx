import { CompanyReservations } from "@/components/company/company-reservations";
import { getServerApiClient } from "@/utils/server-orpc";

export default async function CompanyReservationsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const api = await getServerApiClient();
  const rows = await api.reservations.listCompany({ companyId, status: "ALL" });
  return <CompanyReservations companyId={companyId} initialRows={rows as Record<string, unknown>[]} />;
}
