"use client";

import type mapboxgl from "mapbox-gl";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { env } from "@asaselink/env/web";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { boundaryData, EMPTY_COLLECTION, type Position } from "./estate-boundary";
import { PlaceAutocomplete, type PlaceSelection } from "./place-autocomplete";

export function EstateBoundaryEditor({ companyId }: { companyId: string }) {
  const mapId = useId().replaceAll(":", "");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pointsRef = useRef<Position[]>([]);
  const router = useRouter();
  const [points, setPoints] = useState<Position[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;

    void import("mapbox-gl").then(({ default: mapbox }) => {
      if (disposed || !containerRef.current) return;
      mapbox.accessToken = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const map = new mapbox.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [-0.187, 5.6037],
        zoom: 11,
        attributionControl: false,
      });
      mapRef.current = map;
      resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);
      requestAnimationFrame(() => map.resize());
      map.addControl(new mapbox.NavigationControl({ showCompass: true }), "top-right");
      map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-right");
      map.on("load", () => {
        map.addSource("draft-boundary", { type: "geojson", data: EMPTY_COLLECTION });
        map.addLayer({ id: "draft-boundary-fill", type: "fill", source: "draft-boundary", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "#d9a817", "fill-opacity": 0.28 } });
        map.addLayer({ id: "draft-boundary-line", type: "line", source: "draft-boundary", filter: ["in", ["geometry-type"], ["literal", ["Polygon", "LineString"]]], paint: { "line-color": "#fff4c2", "line-width": 3 } });
        map.addLayer({ id: "draft-boundary-points", type: "circle", source: "draft-boundary", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 5, "circle-color": "#ffffff", "circle-stroke-color": "#805d00", "circle-stroke-width": 2 } });
        setMapReady(true);
      });
      map.on("click", ({ lngLat }) => {
        const next = [...pointsRef.current, [lngLat.lng, lngLat.lat] as Position];
        pointsRef.current = next;
        setPoints(next);
        (map.getSource("draft-boundary") as mapboxgl.GeoJSONSource | undefined)?.setData(boundaryData(next));
      });
      map.on("error", (event) => setMapError(event.error?.message || "Satellite map could not load. Check the token URL restrictions and try again."));
    }).catch(() => setMapError("Satellite map could not load."));

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  function updatePoints(next: Position[]) {
    pointsRef.current = next;
    setPoints(next);
    (mapRef.current?.getSource("draft-boundary") as mapboxgl.GeoJSONSource | undefined)?.setData(boundaryData(next));
  }

  function selectPlace(place: PlaceSelection) {
    setRegion(place.region ?? "");
    setDistrict(place.district ?? "");
    mapRef.current?.flyTo({ center: place.coordinates, zoom: 16, essential: true });
  }

  function submit(formData: FormData) {
    if (points.length < 3) return;
    setSubmitError(null);
    const ring = [...points, points[0]!] as Position[];
    startTransition(async () => {
      try {
        await client.land.createEstate({
          companyId,
          name: String(formData.get("name") ?? ""),
          slug: String(formData.get("slug") ?? ""),
          region: String(formData.get("region") ?? ""),
          district: String(formData.get("district") ?? "") || undefined,
          priceFrom: formData.get("priceFrom") ? Number(formData.get("priceFrom")) : undefined,
          reason: "Initial estate boundary registration",
          boundary: { type: "Polygon", coordinates: [ring] },
          address: String(formData.get("address") ?? "") || undefined,
        });
        updatePoints([]);
        router.refresh();
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "The estate could not be saved.");
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby={`${mapId}-title`}>
      <div className="grid lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.55fr)]">
        <form action={submit} className="order-2 space-y-5 p-5 sm:p-7 lg:order-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Estate registry</p>
            <h2 id={`${mapId}-title`} className="mt-2 text-xl font-semibold tracking-tight">Register a mapped estate</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Trace the estate's outer perimeter first. Add as many corners as its real shape requires; three is only the minimum.</p>
          </div>
          <PlaceAutocomplete onSelect={selectPlace} />
          <label className="block text-sm font-medium">Estate name<input required name="name" value={name} onChange={(event) => { const value = event.target.value; setName(value); if (!slugEdited) setSlug(value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} minLength={2} maxLength={256} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <label className="block text-sm font-medium">URL slug<input required name="slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="east-legon-hills" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">Region<input required name="region" value={region} onChange={(event) => setRegion(event.target.value)} minLength={2} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <label className="block text-sm font-medium">District<input name="district" value={district} onChange={(event) => setDistrict(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          </div>
          <label className="block text-sm font-medium">Starting price (GHS)<input name="priceFrom" type="number" min="0" step="0.01" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <div className="rounded-xl bg-muted px-3 py-2.5 text-sm"><div className="flex items-center justify-between"><span>{points.length < 3 ? `${3 - points.length} more corner${3 - points.length === 1 ? "" : "s"} required` : `${points.length} corners added · keep clicking to refine`}</span><button type="button" onClick={() => updatePoints(points.slice(0, -1))} disabled={points.length === 0} className="font-semibold underline-offset-4 hover:underline disabled:opacity-40">Undo last</button></div>{points.length >= 3 ? <p className="mt-1 text-xs text-muted-foreground">Save when the perimeter matches the complete estate boundary. You will map individual plots next.</p> : null}</div>
          {submitError ? <p role="alert" className="text-sm text-destructive">{submitError}</p> : null}
          <Button type="submit" disabled={points.length < 3 || isPending} className="h-12 w-full rounded-xl">{isPending ? "Validating boundary…" : "Validate and register estate"}</Button>
        </form>
        <div className="relative order-1 min-h-[22rem] bg-[#17211d] lg:order-2 lg:min-h-[38rem]">
          <div ref={containerRef} className="absolute inset-0 h-full w-full" style={{ width: "100%", height: "100%" }} aria-label="Satellite map boundary editor" />
          {!mapReady && !mapError ? <div className="absolute inset-0 grid place-items-center text-sm text-white/80">Loading satellite imagery…</div> : null}
          {mapError ? <div role="alert" className="absolute inset-x-4 top-4 rounded-xl border border-red-300/40 bg-black/80 p-3 text-sm text-white backdrop-blur">{mapError}</div> : null}
          <div className="pointer-events-none absolute bottom-5 left-5 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">Unlimited corners · click clockwise around the full perimeter</div>
        </div>
      </div>
    </section>
  );
}
