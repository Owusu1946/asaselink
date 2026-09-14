"use client";

import type mapboxgl from "mapbox-gl";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { useEffect, useRef, useState } from "react";
import { env } from "@asaselink/env/web";

export interface PublicPlot {
  id: string;
  plotNumber: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  areaSquareMeters: string;
  price: string;
  boundary: Geometry;
}

export interface NearbyLandmark {
  id: string;
  category: string;
  name: string;
  address?: string;
  distanceMeters: number;
  coordinates: [number, number];
}

function allCoordinates(geometry: Geometry): number[][] {
  if (geometry.type === "Polygon") return geometry.coordinates.flat(1);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  return [];
}

export function EstatePlotMap({ estateBoundary, plots, landmarks = [], onSelect }: { estateBoundary: Geometry; plots: PublicPlot[]; landmarks?: NearbyLandmark[]; onSelect: (plot: PublicPlot) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const plotsRef = useRef(plots);
  const landmarksRef = useRef(landmarks);
  const onSelectRef = useRef(onSelect);
  const [error, setError] = useState(false);

  useEffect(() => {
    plotsRef.current = plots;
    onSelectRef.current = onSelect;
    const source = mapRef.current?.getSource("plots") as mapboxgl.GeoJSONSource | undefined;
    source?.setData({ type: "FeatureCollection", features: plots.map((plot) => ({ type: "Feature", id: plot.id, properties: { id: plot.id, number: plot.plotNumber, status: plot.status }, geometry: plot.boundary })) });
  }, [onSelect, plots]);

  useEffect(() => {
    landmarksRef.current = landmarks;
    const source = mapRef.current?.getSource("nearby-landmarks") as mapboxgl.GeoJSONSource | undefined;
    source?.setData({ type: "FeatureCollection", features: landmarks.map((landmark) => ({ type: "Feature", properties: { name: landmark.name, category: landmark.category }, geometry: { type: "Point", coordinates: landmark.coordinates } })) });
  }, [landmarks]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    void import("mapbox-gl").then(({ default: mapbox }) => {
      if (disposed || !containerRef.current) return;
      mapbox.accessToken = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const coordinates = allCoordinates(estateBoundary);
      const bounds = coordinates.reduce((value, coordinate) => value.extend(coordinate as [number, number]), new mapbox.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));
      const map = new mapbox.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/satellite-streets-v12", bounds, fitBoundsOptions: { padding: 48, maxZoom: 18 }, attributionControl: false });
      mapRef.current = map;
      resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);
      requestAnimationFrame(() => map.resize());
      map.addControl(new mapbox.NavigationControl(), "top-right");
      map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-right");
      map.on("load", () => {
        const features: Feature[] = plots.map((plot) => ({ type: "Feature", id: plot.id, properties: { id: plot.id, number: plot.plotNumber, status: plot.status }, geometry: plot.boundary }));
        const collection: FeatureCollection = { type: "FeatureCollection", features };
        map.addSource("plots", { type: "geojson", data: collection, promoteId: "id" });
        map.addLayer({ id: "plots-fill", type: "fill", source: "plots", paint: { "fill-color": ["match", ["get", "status"], "AVAILABLE", "#2f855a", "RESERVED", "#d9a817", "#525252"], "fill-opacity": 0.5 } });
        map.addLayer({ id: "plots-outline", type: "line", source: "plots", paint: { "line-color": "#ffffff", "line-width": 2 } });
        map.addSource("nearby-landmarks", { type: "geojson", data: { type: "FeatureCollection", features: landmarksRef.current.map((landmark) => ({ type: "Feature", properties: { name: landmark.name, category: landmark.category }, geometry: { type: "Point", coordinates: landmark.coordinates } })) } });
        map.addLayer({ id: "nearby-landmarks-points", type: "circle", source: "nearby-landmarks", paint: { "circle-radius": 6, "circle-color": "#ffffff", "circle-stroke-color": "#064e3b", "circle-stroke-width": 3 } });
        map.addLayer({ id: "nearby-landmarks-labels", type: "symbol", source: "nearby-landmarks", minzoom: 13, layout: { "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, 1.25], "text-anchor": "top" }, paint: { "text-color": "#ffffff", "text-halo-color": "#10211a", "text-halo-width": 1.5 } });
        map.addLayer({ id: "plot-labels", type: "symbol", source: "plots", layout: { "text-field": ["get", "number"], "text-size": 12 }, paint: { "text-color": "#ffffff", "text-halo-color": "#152019", "text-halo-width": 1.5 } });
        map.on("mouseenter", "plots-fill", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "plots-fill", () => { map.getCanvas().style.cursor = ""; });
        map.on("click", "plots-fill", (event) => {
          const id = event.features?.[0]?.properties?.id;
          const plot = plotsRef.current.find((item) => item.id === id);
          if (plot) onSelectRef.current(plot);
        });
      });
      map.on("error", () => setError(true));
    }).catch(() => setError(true));
    return () => { disposed = true; resizeObserver?.disconnect(); mapRef.current?.remove(); mapRef.current = null; };
  }, [estateBoundary]);

  return <div className="relative min-h-[26rem] overflow-hidden rounded-2xl bg-[#17211d] lg:min-h-[40rem]"><div ref={containerRef} className="absolute inset-0 h-full w-full" style={{ width: "100%", height: "100%" }} aria-label="Satellite map of available estate plots" />{error ? <p role="alert" className="absolute left-4 right-4 top-4 rounded-xl bg-black/80 p-3 text-sm text-white">The map could not load. Plot details remain available in the list.</p> : null}<div className="pointer-events-none absolute bottom-4 left-4 flex gap-2 rounded-full bg-black/75 px-3 py-2 text-xs text-white backdrop-blur"><span>Green: available</span><span>Gold: reserved</span><span>Grey: sold</span></div></div>;
}
