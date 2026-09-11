"use client";

import type { Geometry } from "geojson";
import { useState } from "react";
import { EstateReviewAction } from "./estate-review-action";
import { PlotEditor, type ExistingPlot } from "./plot-editor";

interface EstateWorkspaceClientProps {
  estateId: string;
  name: string;
  region: string;
  status: string;
  boundary: Geometry;
  plots: ExistingPlot[];
}

export function EstateWorkspaceClient({ estateId, name, region, status, boundary, plots }: EstateWorkspaceClientProps) {
  const [plotCount, setPlotCount] = useState(plots.length);

  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm text-muted-foreground">{region}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
        <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">{plotCount} registered plot{plotCount === 1 ? "" : "s"}</p>
      </div>
      <EstateReviewAction estateId={estateId} status={status} plotCount={plotCount} />
    </header>
    <PlotEditor estateId={estateId} estateBoundary={boundary} plots={plots} onPlotCreated={() => setPlotCount((count) => count + 1)} />
  </div>;
}
