"use client";

import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import type mapboxgl from "mapbox-gl";
import type { FeatureCollection, Polygon } from "geojson";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { PlaceAutocomplete } from "@/components/company/place-autocomplete";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";
import { env } from "@asaselink/env/web";

type ScreeningGeometry = { type: "Point"; coordinates: [number, number] } | { type: "Polygon"; coordinates: [number, number][][] };
type ScreeningLayer = { id: string; name: string; kind: string; severity: string; provenance: string; sourceName: string; sourceVersion: string | null; coverageNotes: string; confidenceNotes: string | null; intersects: boolean; boundary: Polygon };
type Report = { id: string; outcome: "CLEAR" | "CAUTION" | "POTENTIAL_RESTRICTION"; coverageComplete: boolean; limitations: string; checkedAt: string | Date; submittedGeometry: ScreeningGeometry; layers: ScreeningLayer[] };

const OUTCOMES = {
  CLEAR: { title: "No mapped concern found", tone: "border-emerald-700 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100" },
  CAUTION: { title: "Review with caution", tone: "border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100" },
  POTENTIAL_RESTRICTION: { title: "Potential restriction found", tone: "border-red-700 bg-red-50 text-red-950 dark:bg-red-950/30 dark:text-red-100" },
} as const;

export function ViabilityChecker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const modeRef = useRef<"point" | "area">("point");
  const [geometry, setGeometry] = useState<ScreeningGeometry | null>(null);
  const [latitude, setLatitude] = useState("5.6037");
  const [longitude, setLongitude] = useState("-0.1870");
  const [report, setReport] = useState<Report | null>(null);
  const [mode, setMode] = useState<"point" | "area">("point");
  const [isPending, startTransition] = useTransition();

  function selectPoint(coordinates: [number, number], zoom = 15) {
    modeRef.current = "point"; setMode("point");
    const point = { type: "Point" as const, coordinates };
    setGeometry(point); setLongitude(coordinates[0].toFixed(6)); setLatitude(coordinates[1].toFixed(6)); setReport(null);
    drawRef.current?.deleteAll(); mapRef.current?.flyTo({ center: coordinates, zoom, essential: true });
    const source = mapRef.current?.getSource("selected-point") as mapboxgl.GeoJSONSource | undefined;
    source?.setData({ type: "Feature", properties: {}, geometry: point });
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;
    void Promise.all([import("mapbox-gl"), import("@mapbox/mapbox-gl-draw")]).then(([{ default: mapbox }, { default: MapboxDrawControl }]) => {
      if (disposed || !containerRef.current) return;
      mapbox.accessToken = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const map = new mapbox.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/satellite-streets-v12", center: [-0.187, 5.6037], zoom: 10, attributionControl: false });
      mapRef.current = map; map.addControl(new mapbox.NavigationControl(), "top-right"); map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-right");
      const draw = new MapboxDrawControl({ displayControlsDefault: false, controls: { polygon: true, trash: true } }); drawRef.current = draw; map.addControl(draw as unknown as mapboxgl.IControl, "top-left");
      const syncArea = () => {
        const feature = draw.getAll().features.find((item) => item.geometry.type === "Polygon");
        if (feature?.geometry.type === "Polygon") { setGeometry(feature.geometry as ScreeningGeometry); setMode("area"); setReport(null); }
      };
      map.on("draw.create", syncArea); map.on("draw.update", syncArea); map.on("draw.delete", () => { setGeometry(null); setReport(null); });
      map.on("load", () => {
        map.addSource("selected-point", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "selected-point-circle", type: "circle", source: "selected-point", paint: { "circle-radius": 9, "circle-color": "#d5a928", "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 } });
        map.addSource("screening-results", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "screening-results-fill", type: "fill", source: "screening-results", paint: { "fill-color": ["match", ["get", "severity"], "potential_restriction", "#b42318", "#d5a928"], "fill-opacity": 0.38 } });
        map.addLayer({ id: "screening-results-line", type: "line", source: "screening-results", paint: { "line-color": ["match", ["get", "severity"], "potential_restriction", "#7a271a", "#854d0e"], "line-width": 3 } });
      });
      map.on("click", (event) => { if (modeRef.current === "point") selectPoint([event.lngLat.lng, event.lngLat.lat], map.getZoom()); });
    }).catch(() => notify.error("The screening map could not load."));
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; drawRef.current = null; };
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource("screening-results") as mapboxgl.GeoJSONSource | undefined;
    const features: FeatureCollection["features"] = (report?.layers ?? []).filter((layer) => layer.intersects).map((layer) => ({ type: "Feature", properties: { severity: layer.severity, name: layer.name }, geometry: layer.boundary }));
    source?.setData({ type: "FeatureCollection", features });
  }, [report]);

  function useCoordinates() {
    const lng = Number(longitude); const lat = Number(latitude);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) { notify.error("Enter valid longitude and latitude values."); return; }
    setMode("point"); selectPoint([lng, lat]);
  }

  function runCheck() {
    if (!geometry) { notify.error("Select a point or draw an area first."); return; }
    startTransition(async () => {
      try { const result = await client.viability.screen({ geometry }); setReport(result as Report); notify.success("Screening report ready"); }
      catch (cause) { notify.apiError(cause, "Screening could not be completed"); }
    });
  }

  function changeMode(next: "point" | "area") {
    modeRef.current = next; setMode(next); setGeometry(null); setReport(null); drawRef.current?.deleteAll();
    const source = mapRef.current?.getSource("selected-point") as mapboxgl.GeoJSONSource | undefined;
    source?.setData({ type: "FeatureCollection", features: [] });
    if (next === "area") drawRef.current?.changeMode("draw_polygon");
  }

  const outcome = report ? OUTCOMES[report.outcome] : null;
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,.65fr)]">
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="grid gap-4 border-b border-border p-4 sm:grid-cols-[1fr_auto] sm:p-5">
        <PlaceAutocomplete onSelect={(place) => { setMode("point"); selectPoint(place.coordinates); }} />
        <div className="flex self-end rounded-xl bg-muted p-1" aria-label="Selection mode">
          <button type="button" onClick={() => changeMode("point")} className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${mode === "point" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Point</button>
          <button type="button" onClick={() => changeMode("area")} className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${mode === "area" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Draw area</button>
        </div>
      </div>
      <div ref={containerRef} className="h-[28rem] w-full sm:h-[34rem]" aria-label="Land viability screening map" />
      <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-[1fr_1fr_auto] sm:p-5">
        <label className="text-sm font-medium">Latitude<input value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3" /></label>
        <label className="text-sm font-medium">Longitude<input value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3" /></label>
        <Button type="button" variant="outline" onClick={useCoordinates} className="self-end">Use coordinates</Button>
      </div>
    </section>
    <aside className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Indicative screening</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Select a point or draw a small area. We compare it with active wetland, water, flood, protected-area, planning, and company-declared concern layers.</p>
        <Button type="button" onClick={runCheck} disabled={!geometry || isPending} className="mt-5 min-h-12 w-full">{isPending ? "Checking layers…" : "Check this land"}</Button>
      </div>
      {report && outcome ? <div className={`rounded-3xl border-l-4 p-5 sm:p-6 ${outcome.tone}`} aria-live="polite">
        <p className="text-xs font-semibold">Indicative result</p><h2 className="mt-1 text-2xl font-bold">{outcome.title}</h2>
        <p className="mt-3 text-sm leading-6">{report.limitations}</p>
        <p className="mt-3 text-xs opacity-75">Checked {new Date(report.checkedAt).toLocaleString()} · Report {report.id.slice(0, 8)}</p>
      </div> : null}
      {report?.layers.filter((layer) => layer.intersects).map((layer) => <article key={layer.id} className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{layer.name}</h3><span className="rounded-full border border-current/20 px-2 py-1 text-xs font-semibold">{layer.provenance === "company_declared" ? "Company declared" : layer.provenance === "prototype" ? "Prototype data" : "External dataset"}</span></div>
        <p className="mt-2 text-sm text-muted-foreground">{layer.kind.replaceAll("_", " ")} · {layer.sourceName}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{layer.coverageNotes}</p>
      </article>)}
      <div className="rounded-2xl border border-dashed border-border p-4 text-xs leading-5 text-muted-foreground">This report is not title, boundary, survey, EPA, planning, or Lands Commission approval. Confirm findings with the relevant authority and qualified professionals before buying or developing land.</div>
    </aside>
  </div>;
}
