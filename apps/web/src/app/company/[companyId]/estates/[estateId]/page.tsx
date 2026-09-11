import type { Geometry } from "geojson";
import { notFound } from "next/navigation";
import { PlotEditor } from "@/components/company/plot-editor";
import { EstateReviewAction } from "@/components/company/estate-review-action";
import { getServerApiClient } from "@/utils/server-orpc";

interface WorkspacePlot { id: string; plotNumber: string; status: string; price: string; areaSquareMeters: string; boundary: Geometry }

export default async function EstateWorkspacePage({ params }: { params: Promise<{ companyId: string; estateId: string }> }) {
  const { companyId, estateId } = await params;
  try {
    const api = await getServerApiClient();
    const estate = await api.land.getEstateWorkspace({ companyId, estateId }) as Record<string, unknown>;
    const plots = estate.plots as WorkspacePlot[];
    return <div className="space-y-6"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted-foreground">{String(estate.region)}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{String(estate.name)}</h1><p className="mt-2 text-sm text-muted-foreground">{plots.length} registered plot{plots.length === 1 ? "" : "s"}</p></div><EstateReviewAction estateId={estateId} status={String(estate.status)} plotCount={plots.length} /></header><PlotEditor estateId={estateId} estateBoundary={estate.boundary as Geometry} plots={plots} /></div>;
  } catch { notFound(); }
}
