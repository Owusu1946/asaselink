"use client";

import type mapboxgl from "mapbox-gl";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { FeatureCollection, Geometry } from "geojson";
import { useEffect, useRef, useState, useTransition } from "react";
import { env } from "@asaselink/env/web";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import type { Position } from "./estate-boundary";
import { notify } from "@/utils/notify";

interface ExistingPlot { id: string; plotNumber: string; status: string; price: string; areaSquareMeters: string; boundary: Geometry }

function coordinates(geometry: Geometry): number[][] {
  if (geometry.type === "Polygon") return geometry.coordinates.flat(1);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  return [];
}

export function PlotEditor({ estateId, estateBoundary, plots }: { estateId: string; estateBoundary: Geometry; plots: ExistingPlot[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [points, setPoints] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedPlots, setSavedPlots] = useState(plots);
  const [isPending, startTransition] = useTransition();

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
      const positions = coordinates(estateBoundary);
      const bounds = new mapbox.LngLatBounds(positions[0] as [number, number], positions[0] as [number, number]);
      positions.forEach((position) => bounds.extend(position as [number, number]));
      const map = new mapbox.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/satellite-streets-v12", bounds, fitBoundsOptions: { padding: 52, maxZoom: 19 }, attributionControl: false });
      mapRef.current = map;
      resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);
      requestAnimationFrame(() => map.resize());
      map.addControl(new mapbox.NavigationControl(), "top-right");
      map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-right");
      const draw = new MapboxDrawControl({ displayControlsDefault: false, controls: { polygon: true, trash: true }, defaultMode: "draw_polygon" });
      drawRef.current = draw;
      map.addControl(draw as unknown as mapboxgl.IControl, "top-left");
      const syncDraft = () => {
        const polygon = draw.getAll().features.find((feature) => feature.geometry.type === "Polygon");
        const ring = polygon?.geometry.type === "Polygon" ? polygon.geometry.coordinates[0] : undefined;
        setPoints((ring?.slice(0, -1) ?? []) as Position[]);
      };
      map.on("draw.create", syncDraft);
      map.on("draw.update", syncDraft);
      map.on("draw.delete", syncDraft);
      map.on("load", () => {
        const existing: FeatureCollection = { type: "FeatureCollection", features: savedPlots.map((plot) => ({ type: "Feature", properties: { number: plot.plotNumber, status: plot.status }, geometry: plot.boundary })) };
        map.addSource("estate", { type: "geojson", data: { type: "Feature", properties: {}, geometry: estateBoundary } });
        map.addLayer({ id: "estate-line", type: "line", source: "estate", paint: { "line-color": "#fff4c2", "line-width": 3, "line-dasharray": [2, 1] } });
        map.addSource("existing-plots", { type: "geojson", data: existing });
        map.addLayer({ id: "existing-fill", type: "fill", source: "existing-plots", paint: { "fill-color": ["match", ["get", "status"], "AVAILABLE", "#2f855a", "RESERVED", "#d9a817", "#525252"], "fill-opacity": 0.42 } });
        map.addLayer({ id: "existing-line", type: "line", source: "existing-plots", paint: { "line-color": "#ffffff", "line-width": 1.5 } });
        map.addLayer({ id: "existing-label", type: "symbol", source: "existing-plots", layout: { "text-field": ["get", "number"], "text-size": 11 }, paint: { "text-color": "#ffffff", "text-halo-color": "#17211d", "text-halo-width": 1.5 } });
      });
    }).catch(() => setError("The satellite editor could not load."));
    return () => { disposed = true; resizeObserver?.disconnect(); drawRef.current = null; mapRef.current?.remove(); mapRef.current = null; };
  }, [estateBoundary]);

  function resetDraft() { drawRef.current?.deleteAll(); drawRef.current?.changeMode("draw_polygon"); setPoints([]); }
  function create(formData: FormData) {
    if (points.length < 3) return;
    setError(null);
    startTransition(async () => {
      try {
        const created = await client.land.createPlot({ estateId, plotNumber: String(formData.get("plotNumber") ?? ""), price: Number(formData.get("price")), reason: "Initial surveyed plot registration", boundary: { type: "Polygon", coordinates: [[...points, points[0]!]] } });
        setSavedPlots((current) => current.some((plot) => plot.id === created.id) ? current : [...current, created]);
        notify.success("Plot added", { description: `Plot ${created.plotNumber} is now mapped.` });
        resetDraft();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "The plot could not be saved."); notify.apiError(cause, "Plot could not be added"); }
    });
  }

  return <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[20rem_minmax(0,1fr)]"><form action={create} className="order-2 space-y-5 p-5 lg:order-1"><div><h2 className="text-xl font-semibold">Add a surveyed plot</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Trace one plot using as many corners as its surveyed shape requires. Double-click to finish, then drag any vertex to align it precisely.</p></div><label className="block text-sm font-medium">Plot number<input required name="plotNumber" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3" placeholder="A-104" /></label><label className="block text-sm font-medium">Price (GHS)<input required name="price" type="number" min="0" step="0.01" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3" /></label><div className="min-h-11 rounded-xl bg-muted px-3 py-2 text-sm"><div className="flex items-center justify-between"><span>{points.length >= 3 ? `${points.length} editable corners ready` : "Draw and finish the plot boundary"}</span><button type="button" onClick={resetDraft} disabled={!points.length} className="font-semibold disabled:opacity-40">Redraw</button></div>{points.length >= 3 ? <p className="mt-1 text-xs text-muted-foreground">Drag white vertices to refine the demarcation before saving.</p> : null}</div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button type="submit" className="h-12 w-full rounded-xl" disabled={points.length < 3 || isPending}>{isPending ? "Validating…" : "Add plot"}</Button></form><div className="relative order-1 min-h-[24rem] bg-[#17211d] lg:order-2 lg:min-h-[40rem]"><div ref={containerRef} className="absolute inset-0 h-full w-full" style={{ width: "100%", height: "100%" }} aria-label="Satellite plot drawing editor" /><p className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/75 px-3 py-2 text-xs text-white">Click corners · double-click to finish · drag to refine</p></div></div>;
}
