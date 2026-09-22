"use client";

import { useEffect, useId, useState } from "react";
import { env } from "@asaselink/env/web";
import { client } from "@/utils/orpc";

type EstateBoundary = { type: "Polygon"; coordinates: [number, number][][] } | { type: "MultiPolygon"; coordinates: [number, number][][][] };
export interface PlaceSelection { label: string; coordinates: [number, number]; region?: string; district?: string; kind?: "estate" | "place"; boundary?: EstateBoundary }
interface SearchFeature { geometry?: { coordinates?: number[] }; properties?: { full_address?: string; name?: string; context?: { region?: { name?: string }; district?: { name?: string }; place?: { name?: string } } } }
interface EstateSearchResult { id: string; name: string; companyName: string; region: string; district?: string | null; longitude: number; latitude: number; searchBoundary?: EstateBoundary | null }

export function PlaceAutocomplete({ onSelect }: { onSelect: (place: PlaceSelection) => void }) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSelection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query.trim(), access_token: env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN, country: "gh", autocomplete: "true", limit: "5", language: "en" });
        const [mapboxResult, estateResult] = await Promise.allSettled([
          fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { signal: controller.signal }).then(async (response) => {
            if (!response.ok) throw new Error("Location search failed");
            return response.json() as Promise<{ features?: SearchFeature[] }>;
          }),
          client.land.listPublished({ limit: 5, offset: 0, query: query.trim() }).then((rows) => rows as unknown as EstateSearchResult[]),
        ]);
        const places = mapboxResult.status === "fulfilled" ? (mapboxResult.value.features ?? []).flatMap((feature) => {
          const values = feature.geometry?.coordinates;
          if (!values || values.length < 2) return [];
          const context = feature.properties?.context;
          return [{ label: feature.properties?.full_address ?? feature.properties?.name ?? query, coordinates: [values[0]!, values[1]!] as [number, number], region: context?.region?.name, district: context?.district?.name ?? context?.place?.name, kind: "place" as const }];
        }) : [];
        const estateMatches = estateResult.status === "fulfilled" ? estateResult.value.map((estate) => ({
          label: estate.name,
          coordinates: [Number(estate.longitude), Number(estate.latitude)] as [number, number],
          region: estate.region,
          district: estate.district ?? undefined,
          kind: "estate" as const,
          boundary: estate.searchBoundary ?? undefined,
        })) : [];
        setResults([...estateMatches, ...places].slice(0, 8));
      } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  return <div className="relative"><label htmlFor={`${listId}-input`} className="block text-sm font-medium">Find estate or location</label><input id={`${listId}-input`} value={query} onChange={(event) => setQuery(event.target.value)} role="combobox" aria-autocomplete="list" aria-controls={listId} aria-expanded={results.length > 0} placeholder="Search an estate, address, or town in Ghana" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" />{loading ? <span className="absolute right-3 top-10 text-xs text-muted-foreground">Searching…</span> : null}{results.length ? <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg">{results.map((result) => <li key={`${result.kind}-${result.label}-${result.coordinates.join()}`}><button type="button" role="option" onClick={() => { setQuery(result.label); setResults([]); onSelect(result); }} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"><span>{result.label}</span><span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{result.kind === "estate" ? "AsaseLink estate" : "Place"}</span></button></li>)}</ul> : null}<input type="hidden" name="address" value={query} /></div>;
}
