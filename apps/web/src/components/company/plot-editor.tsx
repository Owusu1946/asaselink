"use client";

import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import type mapboxgl from "mapbox-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { useEffect, useRef, useState, useTransition } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { env } from "@asaselink/env/web";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";
import type { Position } from "./estate-boundary";

export interface ExistingPlot { id: string; plotNumber: string; status: string; price: string; areaSquareMeters: string; boundary: Geometry }
export interface EstateSitePlan { id: string; fileName: string; imageUrl: string; coordinates: [[number, number], [number, number], [number, number], [number, number]] | null; opacity: number; alignmentLocked: boolean }
type OverlayCoordinates = NonNullable<EstateSitePlan["coordinates"]>;
type Props = { estateId: string; estateBoundary: Geometry; plots: ExistingPlot[]; initialSitePlan: EstateSitePlan | null; onPlotCreated?: () => void };

function geometryPositions(geometry: Geometry): number[][] {
  if (geometry.type === "Polygon") return geometry.coordinates.flat(1);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  return [];
}

function asOverlay(points: Array<[number, number]>): OverlayCoordinates {
  return points as OverlayCoordinates;
}

function transformInScreenSpace(map: mapboxgl.Map, coordinates: OverlayCoordinates, transform: (point: { x: number; y: number }, center: { x: number; y: number }) => { x: number; y: number }) {
  const projected = coordinates.map((coordinate) => map.project(coordinate));
  const center = projected.reduce((total, point) => ({ x: total.x + point.x / 4, y: total.y + point.y / 4 }), { x: 0, y: 0 });
  return asOverlay(projected.map((point) => { const next = transform(point, center); const lngLat = map.unproject([next.x, next.y]); return [lngLat.lng, lngLat.lat]; }));
}

export function PlotEditor({ estateId, estateBoundary, plots, initialSitePlan, onPlotCreated }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const drawAttachedRef = useRef(false);
  const overlayImageUrlRef = useRef(initialSitePlan?.imageUrl);
  const alignmentHistoryRef = useRef<OverlayCoordinates[]>([]);
  const [points, setPoints] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedPlots, setSavedPlots] = useState(plots);
  const [sitePlan, setSitePlan] = useState(initialSitePlan);
  const [isUploading, setIsUploading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [handleRevision, setHandleRevision] = useState(0);
  const [, setViewportRevision] = useState(0);
  const [isPending, startTransition] = useTransition();
  const canDraw = !sitePlan || sitePlan.alignmentLocked;

  function updateCoordinates(next: OverlayCoordinates, remember = true) {
    setSitePlan((current) => {
      if (!current?.coordinates) return current;
      if (remember) alignmentHistoryRef.current = [...alignmentHistoryRef.current.slice(-19), current.coordinates];
      return { ...current, coordinates: next };
    });
  }

  function transformPlan(kind: "rotate-left" | "rotate-right" | "grow" | "shrink" | "left" | "right" | "up" | "down") {
    const map = mapRef.current;
    if (!map || !sitePlan?.coordinates || sitePlan.alignmentLocked) return;
    const angle = kind === "rotate-left" ? -2 * Math.PI / 180 : kind === "rotate-right" ? 2 * Math.PI / 180 : 0;
    const scale = kind === "grow" ? 1.05 : kind === "shrink" ? 0.95 : 1;
    const dx = kind === "left" ? -4 : kind === "right" ? 4 : 0;
    const dy = kind === "up" ? -4 : kind === "down" ? 4 : 0;
    updateCoordinates(transformInScreenSpace(map, sitePlan.coordinates, (point, center) => {
      const x = (point.x - center.x) * scale; const y = (point.y - center.y) * scale;
      return { x: center.x + x * Math.cos(angle) - y * Math.sin(angle) + dx, y: center.y + x * Math.sin(angle) + y * Math.cos(angle) + dy };
    }));
    setHandleRevision((value) => value + 1);
  }

  function fitPlanToEstate() {
    const map = mapRef.current; if (!map || !sitePlan?.coordinates) return;
    const positions = geometryPositions(estateBoundary).map((position) => map.project(position as [number, number]));
    const xs = positions.map((point) => point.x); const ys = positions.map((point) => point.y);
    const west = Math.min(...xs); const east = Math.max(...xs); const north = Math.min(...ys); const south = Math.max(...ys);
    updateCoordinates(asOverlay([[west, north], [east, north], [east, south], [west, south]].map(([x, y]) => { const point = map.unproject([x, y]); return [point.lng, point.lat]; })));
    setHandleRevision((value) => value + 1);
  }

  function undoAlignment() {
    const previous = alignmentHistoryRef.current.at(-1); if (!previous) return;
    alignmentHistoryRef.current = alignmentHistoryRef.current.slice(0, -1); updateCoordinates(previous, false); setHandleRevision((value) => value + 1);
  }

  function beginDirectTransform(mode: "corner" | "edge" | "move" | "rotate", index: number, event: ReactPointerEvent<HTMLButtonElement>) {
    const map = mapRef.current; const base = sitePlan?.coordinates;
    if (!map || !base || sitePlan.alignmentLocked) return;
    event.preventDefault();
    alignmentHistoryRef.current = [...alignmentHistoryRef.current.slice(-19), base];
    const rect = map.getContainer().getBoundingClientRect();
    const start = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const projected = base.map((coordinate) => map.project(coordinate));
    const center = projected.reduce((total, point) => ({ x: total.x + point.x / 4, y: total.y + point.y / 4 }), { x: 0, y: 0 });
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
    const edgePairs = [[0, 1], [1, 2], [2, 3], [3, 0]] as const;
    map.dragPan.disable();
    const onMove = (pointer: PointerEvent) => {
      const current = { x: pointer.clientX - rect.left, y: pointer.clientY - rect.top };
      const dx = current.x - start.x; const dy = current.y - start.y;
      let next = projected.map((point) => ({ x: point.x, y: point.y }));
      if (mode === "corner") next[index] = current;
      if (mode === "edge") { const pair = edgePairs[index]!; next = next.map((point, pointIndex) => pointIndex === pair[0] || pointIndex === pair[1] ? { x: point.x + dx, y: point.y + dy } : point); }
      if (mode === "move") next = next.map((point) => ({ x: point.x + dx, y: point.y + dy }));
      if (mode === "rotate") {
        const angle = Math.atan2(current.y - center.y, current.x - center.x) - startAngle;
        next = next.map((point) => { const x = point.x - center.x; const y = point.y - center.y; return { x: center.x + x * Math.cos(angle) - y * Math.sin(angle), y: center.y + x * Math.sin(angle) + y * Math.cos(angle) }; });
      }
      updateCoordinates(asOverlay(next.map((point) => { const lngLat = map.unproject([point.x, point.y]); return [lngLat.lng, lngLat.lat]; })), false);
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); map.dragPan.enable(); setHandleRevision((value) => value + 1); };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp, { once: true });
  }

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
      mapbox.accessToken = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const positions = geometryPositions(estateBoundary);
      const bounds = new mapbox.LngLatBounds(positions[0] as [number, number], positions[0] as [number, number]);
      positions.forEach((position) => bounds.extend(position as [number, number]));
      const map = new mapbox.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/satellite-streets-v12", bounds, fitBoundsOptions: { padding: 52, maxZoom: 19 }, attributionControl: false });
      mapRef.current = map;
      map.on("move", () => setViewportRevision((value) => value + 1));
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
          map.addSource("site-plan-controls", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...initialSitePlan.coordinates, initialSitePlan.coordinates[0]]] } } });
          map.addLayer({ id: "site-plan-controls-line", type: "line", source: "site-plan-controls", paint: { "line-color": "#2563eb", "line-width": 2.5, "line-dasharray": [1.5, 1] } });
          overlayImageUrlRef.current = initialSitePlan.imageUrl;
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
    return () => { disposed = true; resizeObserver?.disconnect(); drawRef.current = null; mapRef.current?.remove(); mapRef.current = null; };
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
    if (source && overlayImageUrlRef.current === sitePlan.imageUrl) source.setCoordinates(overlayCoordinates);
    else if (source) { source.updateImage({ url: sitePlan.imageUrl, coordinates: overlayCoordinates }); overlayImageUrlRef.current = sitePlan.imageUrl; }
    else { map.addSource("site-plan", { type: "image", url: sitePlan.imageUrl, coordinates: overlayCoordinates }); map.addLayer({ id: "site-plan-layer", type: "raster", source: "site-plan", paint: { "raster-opacity": sitePlan.opacity, "raster-fade-duration": 0 } }, "estate-line"); overlayImageUrlRef.current = sitePlan.imageUrl; }
    const controls = map.getSource("site-plan-controls") as mapboxgl.GeoJSONSource | undefined;
    const controlsData = { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [[...overlayCoordinates, overlayCoordinates[0]]] } };
    if (controls) controls.setData(controlsData); else { map.addSource("site-plan-controls", { type: "geojson", data: controlsData }); map.addLayer({ id: "site-plan-controls-line", type: "line", source: "site-plan-controls", paint: { "line-color": "#2563eb", "line-width": 2.5, "line-dasharray": [1.5, 1] } }); }
    map.setLayoutProperty("site-plan-controls-line", "visibility", sitePlan.alignmentLocked ? "none" : "visible");
    map.setPaintProperty("site-plan-layer", "raster-opacity", sitePlan.opacity);
  }, [sitePlan?.imageUrl, sitePlan?.coordinates, sitePlan?.opacity, mapReady]);

  function resetDraft() { drawRef.current?.deleteAll(); drawRef.current?.changeMode("draw_polygon"); setPoints([]); }

  async function uploadPlan(file: File) {
    if (!(file.type === "image/png" || file.type === "image/jpeg")) { notify.error("Choose a PNG or JPEG site plan."); return; }
    setIsUploading(true); setError(null);
    try {
      const authorization = await client.land.beginEstateSitePlanUpload({ estateId, fileName: file.name, fileSize: file.size, mimeType: file.type });
      const response = await fetch(authorization.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("Cloud storage rejected the upload. Check the R2 CORS policy.");
      const confirmed = await client.land.confirmEstateSitePlanUpload({ planId: authorization.planId });
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

  const handleGeometry = (() => {
    const map = mapRef.current;
    if (!mapReady || !map || !sitePlan?.coordinates || sitePlan.alignmentLocked) return null;
    const corners = sitePlan.coordinates.map((coordinate) => map.project(coordinate));
    const center = corners.reduce((total, point) => ({ x: total.x + point.x / 4, y: total.y + point.y / 4 }), { x: 0, y: 0 });
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0]].map(([first, second]) => ({ x: (corners[first]!.x + corners[second]!.x) / 2, y: (corners[first]!.y + corners[second]!.y) / 2 }));
    const top = edges[0]!; const outward = { x: top.x - center.x, y: top.y - center.y }; const length = Math.hypot(outward.x, outward.y) || 1;
    const rotate = { x: top.x + outward.x / length * 64, y: top.y + outward.y / length * 64 };
    return { corners, edges, center, rotate, connector: { length: Math.hypot(rotate.x - top.x, rotate.y - top.y), angle: Math.atan2(rotate.y - top.y, rotate.x - top.x) } };
  })();

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3"><div><p className="text-sm font-semibold">Site plan overlay</p><p className="text-xs text-muted-foreground">Visual guide only. PostGIS remains the source of truth.</p></div><div className="flex flex-wrap items-center gap-2">
      {sitePlan ? <><span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium">{sitePlan.alignmentLocked ? "Plot drawing mode" : "Alignment mode"}</span><label className="flex items-center gap-2 text-xs">Opacity<input aria-label="Site plan opacity" type="range" min="0.1" max="1" step="0.05" value={sitePlan.opacity} onChange={(event) => setSitePlan({ ...sitePlan, opacity: Number(event.target.value) })} /></label>{sitePlan.alignmentLocked ? <Button type="button" variant="outline" size="sm" onClick={() => saveAlignment(false)} disabled={isPending}>Unlock alignment</Button> : <><Button type="button" variant="outline" size="sm" onClick={() => saveAlignment(false)} disabled={isPending}>Save alignment</Button><Button type="button" size="sm" onClick={() => saveAlignment(true)} disabled={isPending}>Lock & trace plots</Button></>}</> : null}
      <input ref={fileInputRef} className="sr-only" type="file" accept="image/png,image/jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPlan(file); }} /><Button type="button" variant={sitePlan ? "outline" : "default"} size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>{isUploading ? "Uploading…" : sitePlan ? "Replace plan" : "Upload plan"}</Button>
    </div></div>
    <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[20rem_minmax(0,1fr)]"><form action={create} className="order-2 space-y-5 p-5 lg:order-1"><div><h2 className="text-xl font-semibold">{canDraw ? "Add a surveyed plot" : "Align the site plan"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{canDraw ? "Trace one plot using as many corners as its surveyed shape requires. Double-click to finish, then drag any vertex to align it precisely." : "Use the large controls attached directly to the plan: amber moves, violet rotates, white stretches edges, and blue warps corners."}</p></div><label className="block text-sm font-medium">Plot number<input required name="plotNumber" disabled={!canDraw} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 disabled:opacity-50" placeholder="A-104" /></label><label className="block text-sm font-medium">Price (GHS)<input required name="price" disabled={!canDraw} type="number" min="0" step="0.01" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 disabled:opacity-50" /></label><div className="min-h-11 rounded-xl bg-muted px-3 py-2 text-sm"><div className="flex items-center justify-between"><span>{!canDraw ? "Lock alignment to start tracing" : points.length >= 3 ? `${points.length} editable corners ready` : "Draw and finish the plot boundary"}</span><button type="button" onClick={resetDraft} disabled={!points.length} className="font-semibold disabled:opacity-40">Redraw</button></div>{points.length >= 3 ? <p className="mt-1 text-xs text-muted-foreground">Drag white vertices to refine the demarcation before saving.</p> : null}</div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button type="submit" className="h-12 w-full rounded-xl" disabled={!canDraw || points.length < 3 || isPending}>{isPending ? "Validating…" : "Add plot"}</Button></form><div className="relative order-1 min-h-[24rem] overflow-hidden bg-[#17211d] lg:order-2 lg:min-h-[40rem]"><div ref={containerRef} className="absolute inset-0 h-full w-full" aria-label="Satellite plot drawing editor" />{handleGeometry ? <div className="pointer-events-none absolute inset-0 z-30" aria-label="Direct site plan transform controls"><div className="absolute h-0.5 bg-violet-400" style={{ left: handleGeometry.edges[0]!.x, top: handleGeometry.edges[0]!.y, width: handleGeometry.connector.length, transform: `rotate(${handleGeometry.connector.angle}rad)`, transformOrigin: "left center" }} />{handleGeometry.corners.map((point, index) => <button key={`corner-${index}`} type="button" title={`Warp corner ${index + 1}`} aria-label={`Drag to warp corner ${index + 1}`} onPointerDown={(event) => beginDirectTransform("corner", index, event)} className="pointer-events-auto absolute grid size-11 touch-none cursor-grab place-items-center rounded-full border-[3px] border-white bg-blue-600 text-lg font-black text-white shadow-xl active:cursor-grabbing" style={{ left: point.x, top: point.y, transform: "translate(-50%, -50%)" }}>{["↖", "↗", "↘", "↙"][index]}</button>)}{handleGeometry.edges.map((point, index) => <button key={`edge-${index}`} type="button" title={`Stretch edge ${index + 1}`} aria-label={`Drag to stretch edge ${index + 1}`} onPointerDown={(event) => beginDirectTransform("edge", index, event)} className="pointer-events-auto absolute grid size-11 touch-none cursor-grab place-items-center rounded-xl border-[3px] border-slate-900 bg-white text-lg font-black text-slate-950 shadow-xl active:cursor-grabbing" style={{ left: point.x, top: point.y, transform: "translate(-50%, -50%)" }}>{index % 2 === 0 ? "↕" : "↔"}</button>)}<button type="button" title="Move entire plan" aria-label="Drag to move the entire plan" onPointerDown={(event) => beginDirectTransform("move", 0, event)} className="pointer-events-auto absolute grid size-14 touch-none cursor-move place-items-center rounded-full border-[3px] border-white bg-amber-600 text-xl font-black text-white shadow-xl" style={{ left: handleGeometry.center.x, top: handleGeometry.center.y, transform: "translate(-50%, -50%)" }}>✥</button><button type="button" title="Rotate plan" aria-label="Drag to rotate the plan" onPointerDown={(event) => beginDirectTransform("rotate", 0, event)} className="pointer-events-auto absolute grid size-12 touch-none cursor-grab place-items-center rounded-full border-[3px] border-white bg-violet-600 text-2xl font-black text-white shadow-xl active:cursor-grabbing" style={{ left: handleGeometry.rotate.x, top: handleGeometry.rotate.y, transform: "translate(-50%, -50%)" }}>↻</button></div> : null}{sitePlan && !sitePlan.alignmentLocked ? <div className="absolute left-3 top-3 z-40 flex max-w-[calc(100%-5rem)] flex-wrap items-center gap-1 rounded-xl border border-white/20 bg-black/75 p-1.5 text-white shadow-xl backdrop-blur-md" aria-label="Fine alignment controls"><button type="button" className="h-9 rounded-lg px-3 text-xs font-semibold hover:bg-white/15" onClick={() => transformPlan("rotate-left")}>−2°</button><button type="button" className="h-9 rounded-lg px-3 text-xs font-semibold hover:bg-white/15" onClick={() => transformPlan("rotate-right")}>+2°</button><button type="button" className="size-9 rounded-lg text-lg hover:bg-white/15" onClick={() => transformPlan("shrink")} aria-label="Scale plan down">−</button><button type="button" className="size-9 rounded-lg text-lg hover:bg-white/15" onClick={() => transformPlan("grow")} aria-label="Scale plan up">+</button><button type="button" className="h-9 rounded-lg px-3 text-xs font-semibold hover:bg-white/15 disabled:opacity-40" onClick={undoAlignment} disabled={!alignmentHistoryRef.current.length}>Undo</button><button type="button" className="h-9 rounded-lg px-3 text-xs font-semibold hover:bg-white/15" onClick={fitPlanToEstate}>Fit</button></div> : null}<p className="pointer-events-none absolute bottom-4 left-4 z-40 rounded-full bg-black/75 px-3 py-2 text-xs text-white">{canDraw ? "Click corners · double-click to finish · drag to refine" : "Blue warps · white stretches · amber moves · violet rotates"}</p></div></div>
  </div>;
}
