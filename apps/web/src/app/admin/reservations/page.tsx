import { ReservationInvestigation } from "@/components/admin/reservation-investigation";
import { getServerApiClient } from "@/utils/server-orpc";

export default async function AdminReservationsPage() {
  const api = await getServerApiClient();
  const rows = await api.reservations.adminList({ status: "ALL" });
  return <main className="mx-auto max-w-7xl p-5 sm:p-8"><ReservationInvestigation initialRows={rows as Record<string, unknown>[]} /></main>;
}
