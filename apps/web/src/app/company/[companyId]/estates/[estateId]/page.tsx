import type { Geometry } from "geojson";
import { notFound } from "next/navigation";
import { EstateWorkspaceClient } from "@/components/company/estate-workspace-client";
import { getServerApiClient } from "@/utils/server-orpc";

interface WorkspacePlot { id: string; plotNumber: string; status: string; price: string; areaSquareMeters: string; boundary: Geometry }

export default async function EstateWorkspacePage({ params }: { params: Promise<{ companyId: string; estateId: string }> }) {
  const { companyId, estateId } = await params;
  try {
    const api = await getServerApiClient();
    const estate = await api.land.getEstateWorkspace({ companyId, estateId }) as Record<string, unknown>;
    const plots = estate.plots as WorkspacePlot[];
    return <EstateWorkspaceClient estateId={estateId} name={String(estate.name)} region={String(estate.region)} status={String(estate.status)} boundary={estate.boundary as Geometry} plots={plots} />;
  } catch { notFound(); }
}
