import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Location01Icon,
  MapsLocation01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      tag: "Ground Truth",
      icon: Location01Icon,
      title: "Physically Surveyed Beacons",
      description:
        "Every plot is marked with concrete GPS survey pillars and clear boundary pegs in the soil before listing.",
      image: "/estates/boundary-beacon.jpg",
    },
    {
      step: "02",
      tag: "Spatial Accuracy",
      icon: MapsLocation01Icon,
      title: "Interactive Polygon Maps",
      description:
        "Inspect exact square meter dimensions, road networks, terrain contours, and live status in one spatial interface.",
      image: "/estates/east-legon-hills.jpg",
    },
    {
      step: "03",
      tag: "Buyer Security",
      icon: ShieldCheckIcon,
      title: "Direct Developer Lock",
      description:
        "Connect directly with authenticated estate owners and lock your plot with verifiable transactional transparency.",
      image: "/estates/developer-survey.jpg",
    },
  ];

  return (
    <section id="how-it-works" className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-8 bg-muted/30 border-t border-border/70">
      <div className="mx-auto max-w-6xl">
        {/* Editorial Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-green-800 dark:text-brand-green-400 mb-3">
            <span>The AsaseLink Standard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            From boundary beacon to verified ownership.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Real land decisions require physical proof and spatial truth. No double-sold plots, no phantom layouts.
          </p>
        </div>

        {/* 3 Full-Image Story Tiles (Editorial & Photographic) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((item) => (
            <div
              key={item.step}
              className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/80 bg-neutral-950 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Photographic Background Container */}
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-105"
                />

                {/* Dark Vignette Overlay for High Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />

                {/* Top Tag & Step Number */}
                <div className="absolute left-4 right-4 top-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 py-1 pl-1 pr-3 text-xs font-semibold text-white backdrop-blur-md">
                    <span className="grid size-7 place-items-center rounded-full bg-white/10 text-brand-gold-400"><HugeiconsIcon icon={item.icon} size={14} /></span>
                    <span>{item.tag}</span>
                  </div>

                  <span className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/20">
                    {item.step}
                  </span>
                </div>

                {/* Bottom Story Content Overlaid on Photography */}
                <div className="absolute inset-x-0 bottom-0 p-6 z-10 flex flex-col text-left text-white">
                  <h3 className="text-xl font-bold tracking-tight text-white mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
