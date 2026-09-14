"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Location01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";
import { SearchCapsule, type SearchCriteria } from "./search-capsule";
import eastLegonHills from "../../../public/estates/east-legon-hills.jpg";
import prampramCoastal from "../../../public/estates/prampram-coastal.jpg";
import aburiRidge from "../../../public/estates/aburi-ridge.jpg";
import cantonmentsLuxury from "../../../public/estates/cantonments-luxury.jpg";
import shaiHills from "../../../public/estates/shai-hills.jpg";
import temaCommunity25 from "../../../public/estates/tema-community-25.jpg";

export interface HeroSlide {
  id: string;
  name: string;
  location: string;
  region: string;
  priceStart: string;
  availablePlots: number;
  image: StaticImageData;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "east-legon-hills",
    name: "The Reserve at Hills",
    location: "East Legon Hills",
    region: "Greater Accra",
    priceStart: "GHS 180,000",
    availablePlots: 24,
    image: eastLegonHills,
  },
  {
    id: "prampram-coastal",
    name: "Oceanside Sanctuary",
    location: "Prampram Coast",
    region: "Greater Accra",
    priceStart: "GHS 85,000",
    availablePlots: 38,
    image: prampramCoastal,
  },
  {
    id: "aburi-ridge",
    name: "The Ridge Terraces",
    location: "Aburi Mountain Ridge",
    region: "Eastern Region",
    priceStart: "GHS 240,000",
    availablePlots: 14,
    image: aburiRidge,
  },
  {
    id: "cantonments-luxury",
    name: "The Embassy Enclave",
    location: "Cantonments",
    region: "Accra Central",
    priceStart: "GHS 950,000",
    availablePlots: 5,
    image: cantonmentsLuxury,
  },
  {
    id: "shai-hills",
    name: "Shai Savanna Reserve",
    location: "Shai Hills",
    region: "Greater Accra",
    priceStart: "GHS 110,000",
    availablePlots: 28,
    image: shaiHills,
  },
  {
    id: "tema-comm-25",
    name: "Emerald Gardens",
    location: "Tema Community 25",
    region: "Greater Accra",
    priceStart: "GHS 140,000",
    availablePlots: 32,
    image: temaCommunity25,
  },
];

interface HeroSectionProps {
  onSearchCriteriaChange?: (criteria: SearchCriteria) => void;
  initialSearchCriteria?: SearchCriteria | null;
}

export function HeroSection({ onSearchCriteriaChange, initialSearchCriteria }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Keyboard navigation (left/right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Subtle auto-advance when not paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative w-full px-3 pb-8 pt-1 sm:px-6 sm:pb-12 sm:pt-2 md:px-8">
      <div
        className="relative mx-auto min-h-[calc(100svh-5.25rem)] w-full max-w-7xl overflow-hidden rounded-[1.35rem] border border-white/10 bg-neutral-950 shadow-lg sm:h-[78vh] sm:min-h-[560px] sm:max-h-[760px] sm:rounded-[2.5rem]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Full-Fledged Background Image Slider with Eager Preloading */}
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 size-full transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.name}
                fill
                priority={index === 0}
                placeholder="blur"
                quality={index === 0 ? 78 : 72}
                sizes="(max-width: 640px) calc(100vw - 1.5rem), (max-width: 1280px) calc(100vw - 3rem), 1280px"
                className={`object-cover transition-transform duration-1000 ease-out ${
                  isActive ? "scale-100" : "scale-105"
                }`}
              />
            </div>
          );
        })}

        {/* Cinematic Vignette Overlay for High Legibility & Premium Feel */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-black/45" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Sleek Left and Right Slider Arrows (High z-index to guarantee clickability) */}
        <div className="absolute inset-y-0 left-3 z-40 hidden items-center sm:left-6 sm:flex">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous estate slide"
            className="flex size-11 sm:size-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/75 hover:scale-110 active:scale-95 shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-500"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} />
          </button>
        </div>

        <div className="absolute inset-y-0 right-3 z-40 hidden items-center sm:right-6 sm:flex">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next estate slide"
            className="flex size-11 sm:size-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/75 hover:scale-110 active:scale-95 shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-500"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={22} />
          </button>
        </div>

        {/* Centered Minimal Content Overlay - Pass-through pointer events to background/arrows */}
        <div className="relative z-20 flex min-h-[calc(100svh-5.25rem)] flex-col justify-between p-4 text-white pointer-events-none sm:h-full sm:min-h-0 sm:p-10 md:p-12">
          {/* Top Row: Current Estate Tag & Slide Counter */}
          <div className="flex items-start justify-between gap-2 pointer-events-auto">
            <div className="flex min-w-0 max-w-[calc(100%-4.25rem)] items-center gap-2 rounded-full border border-white/20 bg-black/55 px-2.5 py-2 text-[11px] font-medium text-white backdrop-blur-md sm:max-w-none sm:px-3 sm:text-xs">
              <HugeiconsIcon icon={Location01Icon} size={15} className="shrink-0 text-brand-gold-400" />
              <span className="truncate sm:hidden">{activeSlide.location}</span>
              <span className="hidden sm:inline">
                {activeSlide.name} &middot; {activeSlide.location}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-white/80 border-l border-white/20 pl-2">
                <HugeiconsIcon icon={ShieldCheckIcon} size={12} className="text-brand-gold-400" />
                Verified
              </span>
            </div>

            {/* Slide Index Pill */}
            <div className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white/90 backdrop-blur-md">
              <span>0{currentSlide + 1}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/60">0{HERO_SLIDES.length}</span>
            </div>
          </div>

          {/* Center Minimal Writing & Airbnb Search Capsule */}
          <div className="mx-auto my-8 w-full max-w-4xl px-0 text-center pointer-events-auto sm:my-auto sm:px-2">
            {/* Minimal Editorial Headline */}
            <h1 className="text-balance text-[clamp(2.35rem,12vw,3.25rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-white drop-shadow-md sm:text-5xl md:text-6xl">
              Find your place on the map.
            </h1>

            {/* Minimal Subtext */}
            <p className="mx-auto mt-4 max-w-[32rem] text-balance text-sm font-medium leading-6 text-white/85 drop-shadow sm:text-lg">
              Explore verified estates across Ghana. Transparent plots, direct developers.
            </p>

            {/* Floating Search Capsule */}
            <div className="mt-6 sm:mt-9">
              <SearchCapsule onSearch={onSearchCriteriaChange} initialCriteria={initialSearchCriteria} />
            </div>
          </div>

          {/* Bottom Slider Indicator Dots */}
          <div className="flex min-h-11 items-center justify-center gap-2 pointer-events-auto">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}: ${slide.name}`}
                className={`relative min-h-11 min-w-8 cursor-pointer rounded-full after:absolute after:left-1/2 after:top-1/2 after:h-1.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:transition-all after:duration-300 ${
                  index === currentSlide
                    ? "after:w-8 after:bg-brand-gold-400"
                    : "after:w-2 after:bg-white/50 hover:after:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
