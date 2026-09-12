"use client";

import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import type mapboxgl from "mapbox-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { useEffect, useRef, useState, useTransition } from "react";
import { env } from "@asaselink/env/web";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";
import type { Position } from "./estate-boundary";

export interface ExistingPlot { id: string; plotNumber: string; status: string; price: string; areaSquareMeters: string; boundary: Geometry }
export interface EstateSitePlan { id: string; fileName: string; imageUrl: string; coordinates: [[number, number], [number, number], [number, number], [number, number]] | null; opacity: number; alignmentLocked: boolean }
type Props = { estateId: string; estateBoundary: Geometry; plots: ExistingPlot[]; initialSitePlan: EstateSitePlan | null; onPlotCreated?: () => void };

function geometryPositions(geometry: Geometry): number[][] {
  if (geometry.type === "Polygon") return geometry.coordinates.flat(1);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  return [];
}

export function PlotEditor({ estateId, estateBoundary, plots, initialSitePlan, onPlotCreated }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapboxRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const drawAttachedRef = useRef(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [points, setPoints] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedPlots, setSavedPlots] = useState(plots);
  const [sitePlan, setSitePlan] = useState(initialSitePlan);
  const [isUploading, setIsUploading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canDraw = !sitePlan || sitePlan.alignmentLocked;

  useEffect(() => {
    const source = mapRef.current?.getSource("existing-plots") as mapboxgl.GeoJSONSource | undefined;
    source?.setData({ type: "FeatureCollection", features: savedPlots.map((plot) => ({ type: "Feature", properties: { number: plot.plotNumber, status: plot.status }, geometry: plot.boundary })) });
  }, [savedPlots]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    void Promise.all([import("mapbox-gl"), import("@mapbox/mapbox-gl-draw")]).then(([{ default: mapbox }, { default: MapboxDrawControl }]) => {
      if (disposed || !containerRef.current) return;
      mapboxRef.current = mapbox;
      mapbox.accessToken = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const positions = geometryPositions(estateBoundary);
      const bounds = new mapbox.LngLatBounds(positions[0] as [number, number], positions[0] as [number, number]);
      positions.forEach((position) => bounds.extend(position as [number, number]));
      const map = new mapbox.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/satellite-streets-v12", bounds, fitBoundsOptions: { padding: 52, maxZoom: 19 }, attributionControl: false });
      mapRef.current = map;
      resizeObserver = new ResizeObserver(() => map.resize()); resizeObserver.observe(containerRef.current); requestAnimationFrame(() => map.resize());
      map.addControl(new mapbox.NavigationControl(), "top-right"); map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-right");
      const draw = new MapboxDrawControl({ displayControlsDefault: false, controls: { polygon: true, trash: true }, defaultMode: "draw_polygon" });
      drawRef.current = draw;
      const syncDraft = () => {
        const polygon = draw.getAll().features.find((feature) => feature.geometry.type === "Polygon");
        const ring = polygon?.geometry.type === "Polygon" ? polygon.geometry.coordinates[0] : undefined;
        setPoints((ring?.slice(0, -1) ?? []) as Position[]);
      };
      map.on("draw.create", syncDraft); map.on("draw.update", syncDraft); map.on("draw.delete", syncDraft);
      map.on("load", () => {
        if (initialSitePlan?.coordinates) {
          map.addSource("site-plan", { type: "image", url: initialSitePlan.imageUrl, coordinates: initialSitePlan.coordinates });
          map.addLayer({ id: "site-plan-layer", type: "raster", source: "site-plan", paint: { "raster-opacity": initialSitePlan.opacity, "raster-fade-duration": 0 } });
        }
        const existing: FeatureCollection = { type: "FeatureCollection", features: savedPlots.map((plot) => ({ type: "Feature", properties: { number: plot.plotNumber, status: plot.status }, geometry: plot.boundary })) };
        map.addSource("estate", { type: "geojson", data: { type: "Feature", properties: {}, geometry: estateBoundary } });
        map.addLayer({ id: "estate-line", type: "line", source: "estate", paint: { "line-color": "#fff4c2", "line-width": 3, "line-dasharray": [2, 1] } });
        map.addSource("existing-plots", { type: "geojson", data: existing });
        map.addLayer({ id: "existing-fill", type: "fill", source: "existing-plots", paint: { "fill-color": ["match", ["get", "status"], "AVAILABLE", "#2f855a", "RESERVED", "#d9a817", "#525252"], "fill-opacity": 0.42 } });
        map.addLayer({ id: "existing-line", type: "line", source: "existing-plots", paint: { "line-color": "#ffffff", "line-width": 1.5 } });
        map.addLayer({ id: "existing-label", type: "symbol", source: "existing-plots", layout: { "text-field": ["get", "number"], "text-size": 11 }, paint: { "text-color": "#ffffff", "text-halo-color": "#17211d", "text-halo-width": 1.5 } });
        if (!initialSitePlan || initialSitePlan.alignmentLocked) { map.addControl(draw as unknown as mapboxgl.IControl, "top-left"); drawAttachedRef.current = true; }
        setMapReady(true);
      });
    }).catch(() => setError("The satellite editor could not load."));
    return () => { disposed = true; resizeObserver?.disconnect(); markersRef.current.forEach((marker) => marker.remove()); drawRef.current = null; mapRef.current?.remove(); mapRef.current = null; };
  }, [estateBoundary]);

  useEffect(() => {
    const map = mapRef.current; const draw = drawRef.current;
    if (!map?.loaded() || !draw) return;
    if (canDraw && !drawAttachedRef.current) { map.addControl(draw as unknown as mapboxgl.IControl, "top-left"); drawAttachedRef.current = true; draw.changeMode("draw_polygon"); }
    if (!canDraw && drawAttachedRef.current) { draw.deleteAll(); setPoints([]); map.removeControl(draw as unknown as mapboxgl.IControl); drawAttachedRef.current = false; }
  }, [canDraw, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded() || !sitePlan?.coordinates) return;
    const source = map.getSource("site-plan") as mapboxgl.ImageSource | undefined;
    const overlayCoordinates = sitePlan.coordinates;
    if (source) source.updateImage({ url: sitePlan.imageUrl, coordinates: overlayCoordinates });
    else { map.addSource("site-plan", { type: "image", url: sitePlan.imageUrl, coordinates: overlayCoordinates }); map.addLayer({ id: "site-plan-layer", type: "raster", source: "site-plan", paint: { "raster-opacity": sitePlan.opacity, "raster-fade-duration": 0 } }, "estate-line"); }
    map.setPaintProperty("site-plan-layer", "raster-opacity", sitePlan.opacity);
  }, [sitePlan?.imageUrl, sitePlan?.coordinates, sitePlan?.opacity, mapReady]);

  useEffect(() => {
    markersRef.current.forEach((marker) => marker.remove()); markersRef.current = [];
    const map = mapRef.current; const mapbox = mapboxRef.current;
    if (!map?.loaded() || !mapbox || !sitePlan?.coordinates || sitePlan.alignmentLocked) return;
    markersRef.current = sitePlan.coordinates.map((position, index) => {
      const element = document.createElement("button"); element.type = "button"; element.className = "h-5 w-5 rounded-full border-[3px] border-white bg-amber-500 shadow-md"; element.setAttribute("aria-label", `Move plan corner ${index + 1}`);
      const marker = new mapbox.Marker({ element, draggable: true }).setLngLat(position).addTo(map);
      marker.on("drag", () => setSitePlan((current) => current?.coordinates ? { ...current, coordinates: current.coordinates.map((item, itemIndex) => itemIndex === index ? [marker.getLngLat().lng, marker.getLngLat().lat] : item) as [[number, number], [number, number], [number, number], [number, number]] } : current));
      return marker;
    });
    return () => { markersRef.current.forEach((marker) => marker.remove()); markersRef.current = []; };
  }, [sitePlan?.id, sitePlan?.alignmentLocked, mapReady]);

  function resetDraft() { drawRef.current?.deleteAll(); drawRef.current?.changeMode("draw_polygon"); setPoints([]); }

  async function uploadPlan(file: File) {
    if (!(file.type === "image/png" || file.type === "image/jpeg")) { notify.error("Choose a PNG or JPEG site plan."); return; }
    setIsUploading(true); setError(null);
    try {
      const authorization = await client.land.beginEstateSitePlanUpload({ estateId, fileName: file.name, fileSize: file.size, mimeType: file.type });
      const response = await fetch(authorization.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("Cloud storage rejected the upload. Check the R2 CORS policy.");
      const confirmed = await client.land.confirmEstateSitePlanUpload({ planId: authorization.planId, previousFileKey: authorization.previousFileKey });
      setSitePlan(confirmed as EstateSitePlan); notify.success("Site plan ready", { description: "Drag the four corners to align it with the estate." });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The site plan could not be uploaded."); notify.apiError(cause, "Site plan upload failed"); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  function saveAlignment(alignmentLocked: boolean) {
    if (!sitePlan?.coordinates) return;
    const alignment = { planId: sitePlan.id, coordinates: sitePlan.coordinates, opacity: sitePlan.opacity, alignmentLocked };
    startTransition(async () => {
      try {
        const updated = await client.land.updateEstateSitePlanAlignment(alignment);
        setSitePlan((current) => current ? { ...current, ...updated } : current);
        notify.success(alignmentLocked ? "Alignment locked" : "Alignment saved", { description: alignmentLocked ? "Plot drawing is now enabled." : "You can safely leave and return later." });
      } catch (cause) { notify.apiError(cause, "Alignment could not be saved"); }
    });
  }

  function create(formData: FormData) {
    if (!canDraw || points.length < 3) return;
    setError(null);
    startTransition(async () => {
      try {
        const created = await client.land.createPlot({ estateId, plotNumber: String(formData.get("plotNumber") ?? ""), price: Number(formData.get("price")), reason: "Initial surveyed plot registration", boundary: { type: "Polygon", coordinates: [[...points, points[0]!]] } });
        setSavedPlots((current) => current.some((plot) => plot.id === created.id) ? current : [...current, created]); onPlotCreated?.(); notify.success("Plot added", { description: `Plot ${created.plotNumber} is now mapped.` }); resetDraft();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "The plot could not be saved."); notify.apiError(cause, "Plot could not be added"); }
    });
  }

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3"><div><p className="text-sm font-semibold">Site plan overlay</p><p className="text-xs text-muted-foreground">Visual guide only. PostGIS remains the source of truth.</p></div><div className="flex flex-wrap items-center gap-2">
      {sitePlan ? <><span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium">{sitePlan.alignmentLocked ? "Plot drawing mode" : "Alignment mode"}</span><label className="flex items-center gap-2 text-xs">Opacity<input aria-label="Site plan opacity" type="range" min="0.1" max="1" step="0.05" value={sitePlan.opacity} onChange={(event) => setSitePlan({ ...sitePlan, opacity: Number(event.target.value) })} /></label>{sitePlan.alignmentLocked ? <Button type="button" variant="outline" size="sm" onClick={() => saveAlignment(false)} disabled={isPending}>Unlock alignment</Button> : <><Button type="button" variant="outline" size="sm" onClick={() => saveAlignment(false)} disabled={isPending}>Save alignment</Button><Button type="button" size="sm" onClick={() => saveAlignment(true)} disabled={isPending}>Lock & trace plots</Button></>}</> : null}
      <input ref={fileInputRef} className="sr-only" type="file" accept="image/png,image/jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPlan(file); }} /><Button type="button" variant={sitePlan ? "outline" : "default"} size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>{isUploading ? "Uploading…" : sitePlan ? "Replace plan" : "Upload plan"}</Button>
    </div></div>
    <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[20rem_minmax(0,1fr)]"><form action={create} className="order-2 space-y-5 p-5 lg:order-1"><div><h2 className="text-xl font-semibold">{canDraw ? "Add a surveyed plot" : "Align the site plan"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{canDraw ? "Trace one plot using as many corners as its surveyed shape requires. Double-click to finish, then drag any vertex to align it precisely." : "Drag all four orange corner handles over matching points on the satellite map, adjust opacity, then lock the alignment."}</p></div><label className="block text-sm font-medium">Plot number<input required name="plotNumber" disabled={!canDraw} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 disabled:opacity-50" placeholder="A-104" /></label><label className="block text-sm font-medium">Price (GHS)<input required name="price" disabled={!canDraw} type="number" min="0" step="0.01" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 disabled:opacity-50" /></label><div className="min-h-11 rounded-xl bg-muted px-3 py-2 text-sm"><div className="flex items-center justify-between"><span>{!canDraw ? "Lock alignment to start tracing" : points.length >= 3 ? `${points.length} editable corners ready` : "Draw and finish the plot boundary"}</span><button type="button" onClick={resetDraft} disabled={!points.length} className="font-semibold disabled:opacity-40">Redraw</button></div>{points.length >= 3 ? <p className="mt-1 text-xs text-muted-foreground">Drag white vertices to refine the demarcation before saving.</p> : null}</div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button type="submit" className="h-12 w-full rounded-xl" disabled={!canDraw || points.length < 3 || isPending}>{isPending ? "Validating…" : "Add plot"}</Button></form><div className="relative order-1 min-h-[24rem] bg-[#17211d] lg:order-2 lg:min-h-[40rem]"><div ref={containerRef} className="absolute inset-0 h-full w-full" aria-label="Satellite plot drawing editor" /><p className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/75 px-3 py-2 text-xs text-white">{canDraw ? "Click corners · double-click to finish · drag to refine" : "Drag orange corners · compare with opacity · lock when aligned"}</p></div></div>
  </div>;
}
