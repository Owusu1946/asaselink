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
  const mapboxRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const drawAttachedRef = useRef(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const overlayImageUrlRef = useRef(initialSitePlan?.imageUrl);
  const alignmentHistoryRef = useRef<OverlayCoordinates[]>([]);
  const [points, setPoints] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedPlots, setSavedPlots] = useState(plots);
  const [sitePlan, setSitePlan] = useState(initialSitePlan);
  const [isUploading, setIsUploading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [handleRevision, setHandleRevision] = useState(0);
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
    if (source && overlayImageUrlRef.current === sitePlan.imageUrl) source.setCoordinates(overlayCoordinates);
    else if (source) { source.updateImage({ url: sitePlan.imageUrl, coordinates: overlayCoordinates }); overlayImageUrlRef.current = sitePlan.imageUrl; }
    else { map.addSource("site-plan", { type: "image", url: sitePlan.imageUrl, coordinates: overlayCoordinates }); map.addLayer({ id: "site-plan-layer", type: "raster", source: "site-plan", paint: { "raster-opacity": sitePlan.opacity, "raster-fade-duration": 0 } }, "estate-line"); overlayImageUrlRef.current = sitePlan.imageUrl; }
    map.setPaintProperty("site-plan-layer", "raster-opacity", sitePlan.opacity);
  }, [sitePlan?.imageUrl, sitePlan?.coordinates, sitePlan?.opacity, mapReady]);

  useEffect(() => {
    markersRef.current.forEach((marker) => marker.remove()); markersRef.current = [];
    const map = mapRef.current; const mapbox = mapboxRef.current;
    if (!map?.loaded() || !mapbox || !sitePlan?.coordinates || sitePlan.alignmentLocked) return;
    const original = sitePlan.coordinates;
    const makeHandle = (label: string, color: string, size: number) => { const element = document.createElement("button"); element.type = "button"; element.title = label; element.setAttribute("aria-label", label); Object.assign(element.style, { width: `${size}px`, height: `${size}px`, borderRadius: "999px", border: "3px solid white", background: color, boxShadow: "0 2px 12px rgba(0,0,0,.45)", cursor: "grab" }); return element; };
    const remember = () => { alignmentHistoryRef.current = [...alignmentHistoryRef.current.slice(-19), original]; };
    const corners = original.map((position, index) => {
      const marker = new mapbox.Marker({ element: makeHandle(`Warp corner ${index + 1}`, "#2563eb", 22), draggable: true }).setLngLat(position).addTo(map);
      marker.on("dragstart", remember); marker.on("drag", () => setSitePlan((current) => current?.coordinates ? { ...current, coordinates: asOverlay(current.coordinates.map((item, itemIndex) => itemIndex === index ? [marker.getLngLat().lng, marker.getLngLat().lat] : item)) } : current)); marker.on("dragend", () => setHandleRevision((value) => value + 1));
      return marker;
    });
    const edgePairs = [[0, 1], [1, 2], [2, 3], [3, 0]] as const;
    const edges = edgePairs.map(([first, second], index) => {
      const start = map.project(original[first]); const end = map.project(original[second]); const midpoint = map.unproject([(start.x + end.x) / 2, (start.y + end.y) / 2]);
      const marker = new mapbox.Marker({ element: makeHandle(`Stretch edge ${index + 1}`, "#ffffff", 17), draggable: true }).setLngLat(midpoint).addTo(map); let dragStart = { x: 0, y: 0 };
      marker.on("dragstart", () => { remember(); dragStart = map.project(marker.getLngLat()); }); marker.on("drag", () => { const now = map.project(marker.getLngLat()); const dx = now.x - dragStart.x; const dy = now.y - dragStart.y; setSitePlan((current) => current?.coordinates ? { ...current, coordinates: asOverlay(current.coordinates.map((item, itemIndex) => { if (itemIndex !== first && itemIndex !== second) return item; const p = map.project(item); const moved = map.unproject([p.x + dx, p.y + dy]); return [moved.lng, moved.lat]; })) } : current); dragStart = now; }); marker.on("dragend", () => setHandleRevision((value) => value + 1));
      return marker;
    });
    const projected = original.map((position) => map.project(position)); const centerPoint = projected.reduce((total, point) => ({ x: total.x + point.x / 4, y: total.y + point.y / 4 }), { x: 0, y: 0 });
    const centerMarker = new mapbox.Marker({ element: makeHandle("Move entire plan", "#f59e0b", 26), draggable: true }).setLngLat(map.unproject([centerPoint.x, centerPoint.y])).addTo(map); let centerStart = centerPoint;
    centerMarker.on("dragstart", () => { remember(); centerStart = map.project(centerMarker.getLngLat()); }); centerMarker.on("drag", () => { const now = map.project(centerMarker.getLngLat()); const dx = now.x - centerStart.x; const dy = now.y - centerStart.y; setSitePlan((current) => current?.coordinates ? { ...current, coordinates: transformInScreenSpace(map, current.coordinates, (point) => ({ x: point.x + dx, y: point.y + dy })) } : current); centerStart = now; }); centerMarker.on("dragend", () => setHandleRevision((value) => value + 1));
    const topMid = { x: (projected[0]!.x + projected[1]!.x) / 2, y: (projected[0]!.y + projected[1]!.y) / 2 }; const away = { x: topMid.x - centerPoint.x, y: topMid.y - centerPoint.y }; const length = Math.hypot(away.x, away.y) || 1; const rotatePoint = { x: topMid.x + away.x / length * 42, y: topMid.y + away.y / length * 42 };
    const rotateMarker = new mapbox.Marker({ element: makeHandle("Rotate plan", "#7c3aed", 24), draggable: true }).setLngLat(map.unproject([rotatePoint.x, rotatePoint.y])).addTo(map); let rotationStart = 0; let rotationBase = original;
    rotateMarker.on("dragstart", () => { remember(); rotationBase = sitePlan.coordinates!; const p = map.project(rotateMarker.getLngLat()); rotationStart = Math.atan2(p.y - centerPoint.y, p.x - centerPoint.x); }); rotateMarker.on("drag", () => { const p = map.project(rotateMarker.getLngLat()); const angle = Math.atan2(p.y - centerPoint.y, p.x - centerPoint.x) - rotationStart; setSitePlan((current) => current ? { ...current, coordinates: transformInScreenSpace(map, rotationBase, (point, center) => { const x = point.x - center.x; const y = point.y - center.y; return { x: center.x + x * Math.cos(angle) - y * Math.sin(angle), y: center.y + x * Math.sin(angle) + y * Math.cos(angle) }; }) } : current); }); rotateMarker.on("dragend", () => setHandleRevision((value) => value + 1));
    markersRef.current = [...corners, ...edges, centerMarker, rotateMarker];
    return () => { markersRef.current.forEach((marker) => marker.remove()); markersRef.current = []; };
  }, [sitePlan?.id, sitePlan?.alignmentLocked, mapReady, handleRevision]);

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

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3"><div><p className="text-sm font-semibold">Site plan overlay</p><p className="text-xs text-muted-foreground">Visual guide only. PostGIS remains the source of truth.</p></div><div className="flex flex-wrap items-center gap-2">
      {sitePlan ? <><span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium">{sitePlan.alignmentLocked ? "Plot drawing mode" : "Alignment mode"}</span><label className="flex items-center gap-2 text-xs">Opacity<input aria-label="Site plan opacity" type="range" min="0.1" max="1" step="0.05" value={sitePlan.opacity} onChange={(event) => setSitePlan({ ...sitePlan, opacity: Number(event.target.value) })} /></label>{sitePlan.alignmentLocked ? <Button type="button" variant="outline" size="sm" onClick={() => saveAlignment(false)} disabled={isPending}>Unlock alignment</Button> : <><Button type="button" variant="outline" size="sm" onClick={() => saveAlignment(false)} disabled={isPending}>Save alignment</Button><Button type="button" size="sm" onClick={() => saveAlignment(true)} disabled={isPending}>Lock & trace plots</Button></>}</> : null}
      <input ref={fileInputRef} className="sr-only" type="file" accept="image/png,image/jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPlan(file); }} /><Button type="button" variant={sitePlan ? "outline" : "default"} size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>{isUploading ? "Uploading…" : sitePlan ? "Replace plan" : "Upload plan"}</Button>
    </div></div>
    {sitePlan && !sitePlan.alignmentLocked ? <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3" aria-label="Plan transform controls"><span className="mr-1 text-xs font-semibold text-muted-foreground">Transform</span><Button type="button" size="sm" variant="outline" onClick={() => transformPlan("rotate-left")} aria-label="Rotate plan left two degrees">Rotate −2°</Button><Button type="button" size="sm" variant="outline" onClick={() => transformPlan("rotate-right")} aria-label="Rotate plan right two degrees">Rotate +2°</Button><Button type="button" size="sm" variant="outline" onClick={() => transformPlan("shrink")}>Scale −</Button><Button type="button" size="sm" variant="outline" onClick={() => transformPlan("grow")}>Scale +</Button><div className="flex rounded-lg border border-border"><button type="button" className="size-9 rounded-l-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => transformPlan("left")} aria-label="Move plan left">←</button><button type="button" className="size-9 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => transformPlan("up")} aria-label="Move plan up">↑</button><button type="button" className="size-9 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => transformPlan("down")} aria-label="Move plan down">↓</button><button type="button" className="size-9 rounded-r-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => transformPlan("right")} aria-label="Move plan right">→</button></div><Button type="button" size="sm" variant="outline" onClick={undoAlignment} disabled={!alignmentHistoryRef.current.length}>Undo</Button><Button type="button" size="sm" variant="ghost" onClick={fitPlanToEstate}>Fit to estate</Button><span className="ml-auto hidden text-xs text-muted-foreground xl:inline"><span className="font-semibold text-blue-600">Blue</span> warp · white stretch · <span className="font-semibold text-amber-600">amber</span> move · <span className="font-semibold text-violet-600">violet</span> rotate</span></div> : null}
    <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[20rem_minmax(0,1fr)]"><form action={create} className="order-2 space-y-5 p-5 lg:order-1"><div><h2 className="text-xl font-semibold">{canDraw ? "Add a surveyed plot" : "Align the site plan"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{canDraw ? "Trace one plot using as many corners as its surveyed shape requires. Double-click to finish, then drag any vertex to align it precisely." : "Move the whole plan with the amber handle, rotate with violet, stretch its edges with white, or warp individual blue corners."}</p></div><label className="block text-sm font-medium">Plot number<input required name="plotNumber" disabled={!canDraw} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 disabled:opacity-50" placeholder="A-104" /></label><label className="block text-sm font-medium">Price (GHS)<input required name="price" disabled={!canDraw} type="number" min="0" step="0.01" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 disabled:opacity-50" /></label><div className="min-h-11 rounded-xl bg-muted px-3 py-2 text-sm"><div className="flex items-center justify-between"><span>{!canDraw ? "Lock alignment to start tracing" : points.length >= 3 ? `${points.length} editable corners ready` : "Draw and finish the plot boundary"}</span><button type="button" onClick={resetDraft} disabled={!points.length} className="font-semibold disabled:opacity-40">Redraw</button></div>{points.length >= 3 ? <p className="mt-1 text-xs text-muted-foreground">Drag white vertices to refine the demarcation before saving.</p> : null}</div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button type="submit" className="h-12 w-full rounded-xl" disabled={!canDraw || points.length < 3 || isPending}>{isPending ? "Validating…" : "Add plot"}</Button></form><div className="relative order-1 min-h-[24rem] bg-[#17211d] lg:order-2 lg:min-h-[40rem]"><div ref={containerRef} className="absolute inset-0 h-full w-full" aria-label="Satellite plot drawing editor" /><p className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/75 px-3 py-2 text-xs text-white">{canDraw ? "Click corners · double-click to finish · drag to refine" : "Amber: move · violet: rotate · white: stretch · blue: warp"}</p></div></div>
  </div>;
}
