"use client";

import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import type mapboxgl from "mapbox-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { env } from "@asaselink/env/web";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

type BoundaryPolygon = { type: "Polygon"; coordinates: [number, number][][] };
export type EstateConcern = { id: string; name: string; kind: string; severity: string; sourceName: string; coverageNotes: string; createdAt: string | Date; boundary: BoundaryPolygon };
type ConcernKind = "wetland" | "water_body" | "waterway" | "flood_risk" | "protected_area" | "planning_restriction" | "environmental_restriction" | "utility" | "other";
type ConcernSeverity = "caution" | "potential_restriction";
type Props = { companyId: string; estateId: string; estateBoundary: Geometry; initialConcerns: EstateConcern[] };

function geometryPositions(geometry: Geometry): number[][] {
  if (geometry.type === "Polygon") return geometry.coordinates.flat(1);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  return [];
}

export function EstateConcernManager({ companyId, estateId, estateBoundary, initialConcerns }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BoundaryPolygon | null>(null);
  const [concerns, setConcerns] = useState(initialConcerns);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !containerRef.current || mapRef.current) return;
    let disposed = false;
    void Promise.all([import("mapbox-gl"), import("@mapbox/mapbox-gl-draw")]).then(([{ default: mapbox }, { default: MapboxDrawControl }]) => {
      if (disposed || !containerRef.current) return;
      mapbox.accessToken = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const positions = geometryPositions(estateBoundary);
      const bounds = positions.reduce((value, position) => value.extend(position as [number, number]), new mapbox.LngLatBounds(positions[0] as [number, number], positions[0] as [number, number]));
      const map = new mapbox.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/satellite-streets-v12", bounds, fitBoundsOptions: { padding: 45, maxZoom: 18 }, attributionControl: false });
      mapRef.current = map; map.addControl(new mapbox.NavigationControl(), "top-right"); map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-right");
      const draw = new MapboxDrawControl({ displayControlsDefault: false, controls: { polygon: true, trash: true }, defaultMode: "draw_polygon" }); drawRef.current = draw; map.addControl(draw as unknown as mapboxgl.IControl, "top-left");
      const sync = () => { const item = draw.getAll().features.find((feature) => feature.geometry.type === "Polygon"); setDraft(item?.geometry.type === "Polygon" ? item.geometry as BoundaryPolygon : null); };
      map.on("draw.create", sync); map.on("draw.update", sync); map.on("draw.delete", sync);
      map.on("load", () => {
        map.addSource("estate-concern-boundary", { type: "geojson", data: { type: "Feature", properties: {}, geometry: estateBoundary } });
        map.addLayer({ id: "estate-concern-boundary-line", type: "line", source: "estate-concern-boundary", paint: { "line-color": "#fff4c2", "line-width": 3, "line-dasharray": [2, 1] } });
        map.addSource("declared-concerns", { type: "geojson", data: concernCollection(concerns) });
        map.addLayer({ id: "declared-concerns-fill", type: "fill", source: "declared-concerns", paint: { "fill-color": ["match", ["get", "severity"], "potential_restriction", "#b42318", "#d5a928"], "fill-opacity": 0.42 } });
        map.addLayer({ id: "declared-concerns-line", type: "line", source: "declared-concerns", paint: { "line-color": "#ffffff", "line-width": 2 } });
      });
    }).catch(() => notify.error("The concern-area map could not load."));
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; drawRef.current = null; };
  }, [open, estateBoundary]);

  useEffect(() => {
    const source = mapRef.current?.getSource("declared-concerns") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(concernCollection(concerns));
  }, [concerns]);

  function createConcern(formData: FormData) {
    if (!draft) { notify.error("Draw the concern area on the map first."); return; }
    startTransition(async () => {
      try {
        const concern = await client.viability.declareEstateConcern({
          companyId, estateId, name: String(formData.get("name") ?? ""),
          kind: String(formData.get("kind")) as ConcernKind, severity: String(formData.get("severity")) as ConcernSeverity,
          sourceNote: String(formData.get("sourceNote") ?? ""), boundary: draft, acknowledgement: true,
        }) as EstateConcern;
        setConcerns((current) => [concern, ...current]); drawRef.current?.deleteAll(); drawRef.current?.changeMode("draw_polygon"); setDraft(null);
        notify.success("Concern area added", { description: "It is now visible in screening and blocks overlapping plot registration." });
      } catch (cause) { notify.apiError(cause, "Concern area could not be added"); }
    });
  }

  function removeConcern(concern: EstateConcern) {
    if (!window.confirm(`Remove “${concern.name}”? Its audit history will remain.`)) return;
    startTransition(async () => {
      try { await client.viability.removeEstateConcern({ companyId, concernId: concern.id, reason: "Company corrected an estate concern declaration" }); setConcerns((current) => current.filter((item) => item.id !== concern.id)); notify.success("Concern area removed"); }
      catch (cause) { notify.apiError(cause, "Concern area could not be removed"); }
    });
  }

  return <section className="overflow-hidden rounded-3xl border border-border bg-card">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-20 w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6">
      <span><span className="block text-base font-semibold">Known site concerns</span><span className="mt-1 block text-sm text-muted-foreground">Declare wetlands, waterways, flood risks, protected areas, utilities, or other concerns inside this estate.</span></span>
      <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold">{concerns.length} marked · {open ? "Close" : "Manage"}</span>
    </button>
    {open ? <div className="border-t border-border p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,.6fr)]">
        <div className="overflow-hidden rounded-2xl border border-border"><div ref={containerRef} className="h-[28rem] w-full" aria-label="Map known estate concern areas" /></div>
        <form action={createConcern} className="space-y-4">
          <div><h3 className="text-lg font-semibold">Describe the marked area</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Draw one polygon, then record what your company knows and where that information came from.</p></div>
          <label className="block text-sm font-medium">Label<input name="name" required minLength={2} maxLength={256} placeholder="Northern seasonal wetland" className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3" /></label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Concern type<select name="kind" className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3"><option value="wetland">Wetland</option><option value="water_body">Water body</option><option value="waterway">Waterway</option><option value="flood_risk">Flood risk</option><option value="protected_area">Protected area</option><option value="planning_restriction">Planning concern</option><option value="environmental_restriction">Environmental concern</option><option value="utility">Utility corridor</option><option value="other">Other</option></select></label><label className="text-sm font-medium">Assessment<select name="severity" className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3"><option value="caution">Caution</option><option value="potential_restriction">Potential restriction</option></select></label></div>
          <label className="block text-sm font-medium">Source or reason<textarea name="sourceNote" required minLength={5} maxLength={1000} rows={4} placeholder="Observed during the June 2026 site inspection…" className="mt-1.5 w-full rounded-xl border border-input bg-background p-3" /></label>
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">By saving, you acknowledge this is a company declaration—not an official government, environmental, planning, title, or survey determination.</div>
          <Button type="submit" disabled={!draft || isPending} className="min-h-12 w-full">{isPending ? "Saving…" : "Save concern area"}</Button>
        </form>
      </div>
      {concerns.length ? <div className="mt-6 grid gap-3 md:grid-cols-2">{concerns.map((concern) => <article key={concern.id} className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{concern.name}</h3><p className="mt-1 text-xs text-muted-foreground">{concern.kind.replaceAll("_", " ")} · {concern.severity.replaceAll("_", " ")} · Company declared</p></div><button type="button" onClick={() => removeConcern(concern)} disabled={isPending} className="text-xs font-semibold text-destructive hover:underline">Remove</button></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{concern.coverageNotes}</p></article>)}</div> : <p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">No concern areas have been declared for this estate.</p>}
    </div> : null}
  </section>;
}

function concernCollection(concerns: EstateConcern[]): FeatureCollection {
  return { type: "FeatureCollection", features: concerns.map((concern) => ({ type: "Feature", properties: { name: concern.name, severity: concern.severity }, geometry: concern.boundary })) };
}
