"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FavouriteIcon,
  ShieldCheckIcon,
  Location01Icon,
  SparklesIcon,
  Compass01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

export interface EstateListing {
  id: string;
  name: string;
  location: string;
  region: string;
  category: "Gated Communities" | "Hillside & Ridge" | "Coastal Living" | "Urban Enclaves" | "Eco-Reserves";
  image: string;
  priceStart: string;
  priceNumeric: number;
  availablePlots: number;
  totalPlots: number;
  developer: string;
  features: string;
}

const ESTATES_DATA: EstateListing[] = [
  {
    id: "east-legon-hills-reserve",
    name: "The Reserve at Hills",
    location: "East Legon Hills",
    region: "Greater Accra",
    category: "Gated Communities",
    image: "/estates/east-legon-hills.jpg",
    priceStart: "GHS 180,000",
    priceNumeric: 180000,
    availablePlots: 24,
    totalPlots: 52,
    developer: "Asase Premier Partner",
    features: "Master-planned layout · Underground drainage & electricity",
  },
  {
    id: "prampram-oceanside",
    name: "Oceanside Sanctuary",
    location: "Prampram",
    region: "Greater Accra",
    category: "Coastal Living",
    image: "/estates/prampram-coastal.jpg",
    priceStart: "GHS 85,000",
    priceNumeric: 85000,
    availablePlots: 38,
    totalPlots: 64,
    developer: "Coastline Developers",
    features: "Sea breeze horizon · Clean titled surveyed land",
  },
  {
    id: "aburi-ridge-terraces",
    name: "The Ridge Terraces",
    location: "Aburi",
    region: "Eastern Region",
    category: "Hillside & Ridge",
    image: "/estates/aburi-ridge.jpg",
    priceStart: "GHS 240,000",
    priceNumeric: 240000,
    availablePlots: 14,
    totalPlots: 36,
    developer: "Highland Land Trust",
    features: "Valley mist views · Cool climate & mature green foliage",
  },
  {
    id: "cantonments-embassy-enclave",
    name: "The Embassy Enclave",
    location: "Cantonments",
    region: "Greater Accra",
    category: "Urban Enclaves",
    image: "/estates/cantonments-luxury.jpg",
    priceStart: "GHS 950,000",
    priceNumeric: 950000,
    availablePlots: 5,
    totalPlots: 18,
    developer: "Goldkey Capital Partner",
    features: "Ultra-prime diplomatic zone · Paved interlocking roads",
  },
  {
    id: "shai-hills-savanna",
    name: "Shai Savanna Reserve",
    location: "Shai Hills",
    region: "Greater Accra",
    category: "Eco-Reserves",
    image: "/estates/shai-hills.jpg",
    priceStart: "GHS 110,000",
    priceNumeric: 110000,
    availablePlots: 28,
    totalPlots: 45,
    developer: "Savanna Lands Ghana",
    features: "Granite hills backdrop · Scenic private gated avenue",
  },
  {
    id: "tema-comm-25-emerald",
    name: "Emerald Gardens",
    location: "Tema Community 25",
    region: "Greater Accra",
    category: "Gated Communities",
    image: "/estates/tema-community-25.jpg",
    priceStart: "GHS 140,000",
    priceNumeric: 140000,
    availablePlots: 32,
    totalPlots: 80,
    developer: "Harborland Developments",
    features: "Family gated community · Security gatehouse & utilities",
  },
];

const CATEGORIES = [
  "All Lands",
  "Gated Communities",
  "Hillside & Ridge",
  "Coastal Living",
  "Urban Enclaves",
  "Eco-Reserves",
] as const;

interface ExploreLandsSectionProps {
  estates?: EstateListing[];
  filterCriteria?: { location: string; type: string; budget: string } | null;
}

export function ExploreLandsSection({ estates = ESTATES_DATA, filterCriteria }: ExploreLandsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Lands");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredEstates = useMemo(() => {
    return estates.filter((estate) => {
      // Category tab filter
      if (selectedCategory !== "All Lands" && estate.category !== selectedCategory) {
        return false;
      }

      // Search capsule filter criteria if present
      if (filterCriteria) {
        if (
          filterCriteria.location &&
          filterCriteria.location !== "All of Ghana" &&
          !estate.location.toLowerCase().includes(filterCriteria.location.toLowerCase())
        ) {
          return false;
        }

        if (filterCriteria.budget === "Under GHS 100k" && estate.priceNumeric >= 100000) {
          return false;
        }
        if (
          filterCriteria.budget === "GHS 100k - 250k" &&
          (estate.priceNumeric < 100000 || estate.priceNumeric > 250000)
        ) {
          return false;
        }
        if (
          filterCriteria.budget === "GHS 250k - 500k" &&
          (estate.priceNumeric < 250000 || estate.priceNumeric > 500000)
        ) {
          return false;
        }
        if (filterCriteria.budget === "GHS 500k+" && estate.priceNumeric < 500000) {
          return false;
        }
      }

      return true;
    });
  }, [estates, selectedCategory, filterCriteria]);

  return (
    <section id="explore-lands" className="relative py-12 sm:py-16 px-4 sm:px-6 md:px-8 border-t border-border/60">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand-green-900 dark:text-brand-green-300">
              <span className="grid size-8 place-items-center rounded-full bg-brand-green-50 text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300"><HugeiconsIcon icon={SparklesIcon} size={15} /></span>
              <span>Curated Parcels</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Explore verified estates
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Direct developer layouts with verified boundary pegs and transparent pricing.
            </p>
          </div>

          <div className="text-xs font-medium text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredEstates.length}</span> of{" "}
            {estates.length} verified estates
          </div>
        </div>

        {/* Airbnb-Style Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-brand-green-900 text-white shadow dark:bg-brand-green-600 dark:text-brand-black"
                    : "border border-border/80 bg-background/80 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Image-First Estate Cards Grid */}
        {filteredEstates.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <HugeiconsIcon icon={Compass01Icon} size={36} className="mx-auto text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold text-foreground">No estates match your filters</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your location, estate type, or budget criteria to see available parcels.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory("All Lands")}
              className="mt-4 inline-flex items-center rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredEstates.map((estate) => {
              const isFav = !!favorites[estate.id];

              return (
                <div
                  key={estate.id}
                  className="group relative flex flex-col cursor-pointer transition-transform duration-200"
                >
                  <Link href={`/estates/${estate.id}`} aria-label={`View ${estate.name}`} className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4" />
                  {/* Image Container with Airbnb 4:3 Aspect Ratio */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
                    <Image
                      src={estate.image}
                      alt={estate.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                      className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
                    />

                    {/* Gradient highlight on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-60 transition-opacity group-hover:opacity-80" />

                    {/* Top Left: Verified Developer Badge */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 backdrop-blur-md text-[11px] font-medium text-white shadow">
                      <HugeiconsIcon icon={ShieldCheckIcon} size={13} className="text-brand-gold-400" />
                      <span>{estate.developer}</span>
                    </div>

                    {/* Top Right: Favorite Action */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, estate.id)}
                      aria-label={`Save ${estate.name} to favorites`}
                      className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
                    >
                      <HugeiconsIcon
                        icon={FavouriteIcon}
                        size={16}
                        className={isFav ? "text-red-500 fill-red-500" : "text-white"}
                      />
                    </button>

                    {/* Bottom Image Indicator Dots (Airbnb Style) */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-white shadow-sm" />
                      <span className="size-1 rounded-full bg-white/60 shadow-sm" />
                      <span className="size-1 rounded-full bg-white/60 shadow-sm" />
                    </div>
                  </div>

                  {/* Estate Information Details Below Image */}
                  <div className="mt-3 flex flex-col">
                    {/* Header Row: Location & Available Count */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-foreground text-base tracking-tight truncate group-hover:text-brand-green-800 dark:group-hover:text-brand-green-400 transition-colors">
                        {estate.name}
                      </h3>
                      <span className="shrink-0 text-xs font-medium text-brand-green-800 dark:text-brand-green-400">
                        {estate.availablePlots} plots left
                      </span>
                    </div>

                    {/* Location & Region Subtitle */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <HugeiconsIcon icon={Location01Icon} size={12} className="shrink-0" />
                      <span className="truncate">
                        {estate.location}, {estate.region}
                      </span>
                    </div>

                    {/* Feature / Terrain Note */}
                    <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-1">
                      {estate.features}
                    </p>

                    {/* Price and Action Row */}
                    <div className="mt-2.5 flex items-baseline justify-between border-t border-border/50 pt-2">
                      <div className="text-sm">
                        <span className="font-bold text-foreground">{estate.priceStart}</span>
                        <span className="text-xs text-muted-foreground font-normal"> / plot</span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground group-hover:translate-x-0.5 transition-transform">
                        <span>View layout</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
