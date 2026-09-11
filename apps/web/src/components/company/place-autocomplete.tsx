"use client";

import { useEffect, useId, useState } from "react";
import { env } from "@asaselink/env/web";

export interface PlaceSelection { label: string; coordinates: [number, number]; region?: string; district?: string }
interface SearchFeature { geometry?: { coordinates?: number[] }; properties?: { full_address?: string; name?: string; context?: { region?: { name?: string }; district?: { name?: string }; place?: { name?: string } } } }

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
        const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Location search failed");
        const payload = await response.json() as { features?: SearchFeature[] };
        setResults((payload.features ?? []).flatMap((feature) => {
          const values = feature.geometry?.coordinates;
          if (!values || values.length < 2) return [];
          const context = feature.properties?.context;
          return [{ label: feature.properties?.full_address ?? feature.properties?.name ?? query, coordinates: [values[0]!, values[1]!] as [number, number], region: context?.region?.name, district: context?.district?.name ?? context?.place?.name }];
        }));
      } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  return <div className="relative"><label htmlFor={`${listId}-input`} className="block text-sm font-medium">Find estate location</label><input id={`${listId}-input`} value={query} onChange={(event) => setQuery(event.target.value)} role="combobox" aria-autocomplete="list" aria-controls={listId} aria-expanded={results.length > 0} placeholder="Search an address or town in Ghana" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" />{loading ? <span className="absolute right-3 top-10 text-xs text-muted-foreground">Searching…</span> : null}{results.length ? <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg">{results.map((result) => <li key={`${result.label}-${result.coordinates.join()}`}><button type="button" role="option" onClick={() => { setQuery(result.label); setResults([]); onSelect(result); }} className="min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">{result.label}</button></li>)}</ul> : null}<input type="hidden" name="address" value={query} /></div>;
}
