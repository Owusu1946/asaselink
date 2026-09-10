"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Location01Icon,
  ShieldCheckIcon,
  ArrowRight01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

interface Plot {
  id: string;
  number: string;
  area: string;
  price: string;
  status: "available" | "reserved" | "sold";
  d: string;
  labelX: number;
  labelY: number;
}

const PLOTS: Plot[] = [
  {
    id: "a-104",
    number: "Plot A-104",
    area: "650 m²",
    price: "GHS 180,000",
    status: "available",
    d: "M 280 210 L 360 210 L 350 280 L 270 280 Z",
    labelX: 315,
    labelY: 245,
  },
  {
    id: "a-105",
    number: "Plot A-105",
    area: "720 m²",
    price: "GHS 210,000",
    status: "available",
    d: "M 360 210 L 440 210 L 430 280 L 350 280 Z",
    labelX: 395,
    labelY: 245,
  },
  {
    id: "a-106",
    number: "Plot A-106",
    area: "600 m²",
    price: "GHS 165,000",
    status: "reserved",
    d: "M 440 210 L 520 210 L 510 280 L 430 280 Z",
    labelX: 475,
    labelY: 245,
  },
  {
    id: "a-107",
    number: "Plot A-107",
    area: "850 m²",
    price: "GHS 240,000",
    status: "sold",
    d: "M 520 210 L 600 210 L 590 280 L 510 280 Z",
    labelX: 555,
    labelY: 245,
  },
  {
    id: "b-201",
    number: "Plot B-201",
    area: "650 m²",
    price: "GHS 185,000",
    status: "available",
    d: "M 270 290 L 350 290 L 340 360 L 260 360 Z",
    labelX: 305,
    labelY: 325,
  },
  {
    id: "b-202",
    number: "Plot B-202",
    area: "700 m²",
    price: "GHS 195,000",
    status: "reserved",
    d: "M 350 290 L 430 290 L 420 360 L 340 360 Z",
    labelX: 385,
    labelY: 325,
  },
  {
    id: "b-203",
    number: "Plot B-203",
    area: "650 m²",
    price: "GHS 180,000",
    status: "available",
    d: "M 430 290 L 510 290 L 500 360 L 420 360 Z",
    labelX: 465,
    labelY: 325,
  },
  {
    id: "b-204",
    number: "Plot B-204",
    area: "900 m²",
    price: "GHS 260,000",
    status: "sold",
    d: "M 510 290 L 590 290 L 580 360 L 500 360 Z",
    labelX: 545,
    labelY: 325,
  },
];

export function InteractiveMapPreview() {
  const [selectedPlot, setSelectedPlot] = useState<Plot>(PLOTS[0]);
  const [hoveredPlot, setHoveredPlot] = useState<Plot | null>(null);

  const activePlot = hoveredPlot || selectedPlot;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-border/80 bg-muted shadow-2xl transition-all">
      {/* Background Drone Aerial View */}
      <div className="relative aspect-[16/11] sm:aspect-[16/10] w-full select-none">
        <Image
          src="/estates/east-legon-hills.jpg"
          alt="East Legon Hills Estate Layout"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 720px"
          className="object-cover transition-transform duration-700 hover:scale-105"
        />

        {/* Soft dark-gradient overlay for high contrast interface */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

        {/* Interactive SVG Layer */}
        <svg
          viewBox="0 0 800 500"
          className="absolute inset-0 size-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Estate Master Perimeter Boundary */}
          <polygon
            points="180,120 640,110 680,420 220,430"
            fill="none"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="2"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          {/* Plots */}
          {PLOTS.map((plot) => {
            const isSelected = selectedPlot.id === plot.id;
            const isHovered = hoveredPlot?.id === plot.id;

            let fill = "rgba(79, 119, 90, 0.4)"; // quiet leaf green
            let stroke = "rgba(255, 255, 255, 0.85)";

            if (plot.status === "reserved") {
              fill = "rgba(183, 134, 59, 0.45)"; // ochre
              stroke = "rgba(248, 239, 200, 0.9)";
            } else if (plot.status === "sold") {
              fill = "rgba(60, 60, 60, 0.6)"; // neutral dark gray
              stroke = "rgba(180, 180, 180, 0.5)";
            }

            if (isSelected) {
              fill = "rgba(199, 154, 36, 0.65)"; // bold gold
              stroke = "#FFFFFF";
            }

            return (
              <g
                key={plot.id}
                className="cursor-pointer transition-all duration-200"
                onClick={() => setSelectedPlot(plot)}
                onMouseEnter={() => setHoveredPlot(plot)}
                onMouseLeave={() => setHoveredPlot(null)}
              >
                <path
                  d={plot.d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                  className="transition-all hover:filter hover:brightness-125"
                />
                <text
                  x={plot.labelX}
                  y={plot.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none drop-shadow-sm select-none"
                >
                  {plot.number.replace("Plot ", "")}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Top Estate Identity Badge */}
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 backdrop-blur-md text-white shadow-lg">
          <div className="flex size-6 items-center justify-center rounded-full bg-brand-green-500/30 text-brand-green-300">
            <HugeiconsIcon icon={Location01Icon} size={13} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-tight">The Reserve at Hills</span>
            <span className="text-[10px] text-white/80">East Legon Hills, Greater Accra</span>
          </div>
          <div className="ml-1 flex items-center gap-1 rounded-full bg-brand-gold-500/20 px-2 py-0.5 text-[10px] font-medium text-brand-gold-300 border border-brand-gold-500/30">
            <HugeiconsIcon icon={ShieldCheckIcon} size={11} />
            <span>Verified</span>
          </div>
        </div>

        {/* Status Legend (Top Right) */}
        <div className="absolute right-4 top-4 flex items-center gap-2.5 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 backdrop-blur-md text-[11px] font-medium text-white shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#4F775A]" />
            <span className="text-white/90">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand-gold-500" />
            <span className="text-white/90">Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-neutral-400" />
            <span className="text-white/90">Sold</span>
          </div>
        </div>

        {/* Selected Plot Floating Inspection Card (Anchored Bottom Left) */}
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs rounded-2xl border border-white/25 bg-black/75 p-3.5 backdrop-blur-xl text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-brand-gold-500/20 text-brand-gold-300 border border-brand-gold-500/40">
                <HugeiconsIcon icon={SparklesIcon} size={14} />
              </span>
              <div>
                <h4 className="text-sm font-semibold tracking-tight text-white">
                  {activePlot.number}
                </h4>
                <p className="text-[11px] text-white/70">Demarcated &middot; {activePlot.area}</p>
              </div>
            </div>

            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                activePlot.status === "available"
                  ? "bg-brand-green-500/20 text-brand-green-300 border border-brand-green-500/40"
                  : activePlot.status === "reserved"
                  ? "bg-brand-gold-500/20 text-brand-gold-300 border border-brand-gold-500/40"
                  : "bg-neutral-500/20 text-neutral-300 border border-neutral-500/40"
              }`}
            >
              {activePlot.status}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2.5">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/60">Full Price</span>
              <p className="text-sm font-bold text-white">{activePlot.price}</p>
            </div>

            <Link
              href="#explore-lands"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-900 shadow hover:bg-neutral-100 transition-all active:scale-95"
            >
              <span>Inspect</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
