"use client";

import type { Geometry } from "geojson";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useState } from "react";
import { env } from "@asaselink/env/web";
import type { NearbyLandmark } from "./estate-plot-map";

const LANDMARK_CATEGORIES = [
  { category: "School", terms: ["school", "college", "university"] },
  { category: "Healthcare", terms: ["hospital", "doctor", "pharmacy", "clinic"] },
  { category: "Police", terms: ["police"] },
  { category: "Market", terms: ["grocery", "market", "supermarket", "shop"] },
] as const;

interface TilequeryFeature {
  id?: string | number;
  geometry?: { coordinates?: number[] };
  properties?: { name?: string; maki?: string; class?: string; type?: string; category_en?: string; tilequery?: { distance?: number } };
}

function classify(feature: TilequeryFeature) {
  const properties = feature.properties;
  const searchable = [properties?.maki, properties?.class, properties?.type, properties?.category_en].filter(Boolean).join(" ").toLowerCase();
  return LANDMARK_CATEGORIES.find(({ terms }) => terms.some((term) => searchable.includes(term)))?.category;
}

function geometryCenter(geometry: Geometry): [number, number] | null {
  const points = geometry.type === "Polygon"
    ? geometry.coordinates.flat(1)
    : geometry.type === "MultiPolygon"
      ? geometry.coordinates.flat(2)
      : [];
  if (!points.length) return null;
  const first = points[0];
  const last = points.at(-1);
  const unique = points.length > 1 && first?.[0] === last?.[0] && first?.[1] === last?.[1] ? points.slice(0, -1) : points;
  const total = unique.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  return [total[0] / unique.length, total[1] / unique.length];
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

export function NearbyLandmarks({ plotId, boundary, onChange }: { plotId: string; boundary: Geometry; onChange: (landmarks: NearbyLandmark[]) => void }) {
  const center = useMemo(() => geometryCenter(boundary), [boundary]);
  const [landmarks, setLandmarks] = useState<NearbyLandmark[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const token = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!center || !token) {
      setStatus("error");
      onChange([]);
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setLandmarks([]);
    onChange([]);

    const params = new URLSearchParams({ access_token: token, radius: "10000", limit: "50", layers: "poi_label", geometry: "point" });
    void fetch(`https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${center[0]},${center[1]}.json?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Mapbox tile query returned ${response.status}`);
        return response.json() as Promise<{ features?: TilequeryFeature[] }>;
      })
      .then((payload) => {
      if (controller.signal.aborted) return;
      const found = new Set<string>();
      const next = (payload.features ?? []).flatMap((feature): NearbyLandmark[] => {
        const category = classify(feature);
        const name = feature.properties?.name;
        const coordinates = feature.geometry?.coordinates;
        if (!category || found.has(category) || !name || !coordinates || coordinates.length < 2) return [];
        found.add(category);
        return [{ id: String(feature.id ?? `${category}-${coordinates.join("-")}`), category, name, address: feature.properties?.category_en ?? feature.properties?.type, distanceMeters: Number(feature.properties?.tilequery?.distance ?? 0), coordinates: [coordinates[0]!, coordinates[1]!] }];
      });
      setLandmarks(next);
      onChange(next);
      setStatus(next.length ? "ready" : "error");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });

    return () => controller.abort();
  }, [center, onChange, plotId, revision]);

  return (
    <section className="mt-5 border-t border-border pt-5" aria-labelledby="nearby-landmarks-title">
      <div className="flex items-start justify-between gap-3"><div><h3 id="nearby-landmarks-title" className="text-sm font-semibold">Nearby essentials</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Closest useful places to this plot, ranked by Mapbox.</p></div>{status === "error" ? <button type="button" onClick={() => setRevision((value) => value + 1)} className="grid size-9 shrink-0 place-items-center rounded-full border border-border hover:bg-muted" aria-label="Retry nearby landmark search"><HugeiconsIcon icon={RefreshIcon} size={16} /></button> : null}</div>
      {status === "loading" ? <div className="mt-4 grid gap-2" aria-label="Loading nearby landmarks">{[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-muted" />)}</div> : null}
      {status === "ready" ? <div className="mt-4 grid gap-2">{landmarks.map((landmark) => <article key={landmark.id} className="flex items-center gap-3 rounded-xl border border-border p-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-brand-green-900 dark:text-brand-green-300"><HugeiconsIcon icon={Location01Icon} size={16} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{landmark.name}</p><p className="truncate text-xs text-muted-foreground">{landmark.category}{landmark.address ? ` · ${landmark.address}` : ""}</p></div><span className="shrink-0 text-xs font-semibold tabular-nums">{formatDistance(landmark.distanceMeters)}</span></article>)}</div> : null}
      {status === "error" ? <p className="mt-4 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">Nearby place data is unavailable right now. This does not affect plot availability.</p> : null}
      <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Approximate straight-line distance · © Mapbox and its suppliers</p>
    </section>
  );
}
