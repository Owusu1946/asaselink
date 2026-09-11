"use client";

import type mapboxgl from "mapbox-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { env } from "@asaselink/env/web";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { boundaryData, EMPTY_COLLECTION, type Position } from "./estate-boundary";

interface ExistingPlot { id: string; plotNumber: string; status: string; price: string; areaSquareMeters: string; boundary: Geometry }

function coordinates(geometry: Geometry): number[][] {
  if (geometry.type === "Polygon") return geometry.coordinates.flat(1);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  return [];
}

export function PlotEditor({ estateId, estateBoundary, plots }: { estateId: string; estateBoundary: Geometry; plots: ExistingPlot[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pointsRef = useRef<Position[]>([]);
  const [points, setPoints] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    void import("mapbox-gl").then(({ default: mapbox }) => {
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
      map.on("load", () => {
        const existing: FeatureCollection = { type: "FeatureCollection", features: plots.map((plot) => ({ type: "Feature", properties: { number: plot.plotNumber, status: plot.status }, geometry: plot.boundary })) };
        map.addSource("estate", { type: "geojson", data: { type: "Feature", properties: {}, geometry: estateBoundary } });
        map.addLayer({ id: "estate-line", type: "line", source: "estate", paint: { "line-color": "#fff4c2", "line-width": 3, "line-dasharray": [2, 1] } });
        map.addSource("existing-plots", { type: "geojson", data: existing });
        map.addLayer({ id: "existing-fill", type: "fill", source: "existing-plots", paint: { "fill-color": ["match", ["get", "status"], "AVAILABLE", "#2f855a", "RESERVED", "#d9a817", "#525252"], "fill-opacity": 0.42 } });
        map.addLayer({ id: "existing-line", type: "line", source: "existing-plots", paint: { "line-color": "#ffffff", "line-width": 1.5 } });
        map.addLayer({ id: "existing-label", type: "symbol", source: "existing-plots", layout: { "text-field": ["get", "number"], "text-size": 11 }, paint: { "text-color": "#ffffff", "text-halo-color": "#17211d", "text-halo-width": 1.5 } });
        map.addSource("draft", { type: "geojson", data: EMPTY_COLLECTION });
        map.addLayer({ id: "draft-fill", type: "fill", source: "draft", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "#d9a817", "fill-opacity": 0.55 } });
        map.addLayer({ id: "draft-line", type: "line", source: "draft", paint: { "line-color": "#ffffff", "line-width": 3 } });
      });
      map.on("click", ({ lngLat }) => {
        const next = [...pointsRef.current, [lngLat.lng, lngLat.lat] as Position];
        pointsRef.current = next; setPoints(next);
        (map.getSource("draft") as mapboxgl.GeoJSONSource | undefined)?.setData(boundaryData(next));
      });
    }).catch(() => setError("The satellite editor could not load."));
    return () => { disposed = true; resizeObserver?.disconnect(); mapRef.current?.remove(); mapRef.current = null; };
  }, [estateBoundary, plots]);

  function setDraft(next: Position[]) { pointsRef.current = next; setPoints(next); (mapRef.current?.getSource("draft") as mapboxgl.GeoJSONSource | undefined)?.setData(boundaryData(next)); }
  function create(formData: FormData) {
    if (points.length < 3) return;
    setError(null);
    startTransition(async () => {
      try {
        await client.land.createPlot({ estateId, plotNumber: String(formData.get("plotNumber") ?? ""), price: Number(formData.get("price")), reason: "Initial surveyed plot registration", boundary: { type: "Polygon", coordinates: [[...points, points[0]!]] } });
        setDraft([]); router.refresh();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "The plot could not be saved."); }
    });
  }

  return <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[20rem_minmax(0,1fr)]"><form action={create} className="order-2 space-y-5 p-5 lg:order-1"><div><h2 className="text-xl font-semibold">Add a surveyed plot</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Trace within the estate boundary. Overlaps and out-of-bound shapes are rejected by PostGIS.</p></div><label className="block text-sm font-medium">Plot number<input required name="plotNumber" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3" placeholder="A-104" /></label><label className="block text-sm font-medium">Price (GHS)<input required name="price" type="number" min="0" step="0.01" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3" /></label><div className="flex min-h-11 items-center justify-between rounded-xl bg-muted px-3 text-sm"><span>{points.length >= 3 ? `${points.length} points ready` : `${3 - points.length} more required`}</span><button type="button" onClick={() => setDraft(points.slice(0, -1))} disabled={!points.length} className="font-semibold disabled:opacity-40">Undo</button></div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button className="h-12 w-full rounded-xl" disabled={points.length < 3 || isPending}>{isPending ? "Validating…" : "Add plot"}</Button></form><div className="relative order-1 min-h-[24rem] bg-[#17211d] lg:order-2 lg:min-h-[40rem]"><div ref={containerRef} className="absolute inset-0 h-full w-full" style={{ width: "100%", height: "100%" }} aria-label="Satellite plot drawing editor" /><p className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/75 px-3 py-2 text-xs text-white">Click plot corners clockwise</p></div></div>;
}
