"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Location01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";
import { SearchCapsule, type SearchCriteria } from "./search-capsule";

export interface HeroSlide {
  id: string;
  name: string;
  location: string;
  region: string;
  priceStart: string;
  availablePlots: number;
  image: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "east-legon-hills",
    name: "The Reserve at Hills",
    location: "East Legon Hills",
    region: "Greater Accra",
    priceStart: "GHS 180,000",
    availablePlots: 24,
    image: "/estates/east-legon-hills.jpg",
  },
  {
    id: "prampram-coastal",
    name: "Oceanside Sanctuary",
    location: "Prampram Coast",
    region: "Greater Accra",
    priceStart: "GHS 85,000",
    availablePlots: 38,
    image: "/estates/prampram-coastal.jpg",
  },
  {
    id: "aburi-ridge",
    name: "The Ridge Terraces",
    location: "Aburi Mountain Ridge",
    region: "Eastern Region",
    priceStart: "GHS 240,000",
    availablePlots: 14,
    image: "/estates/aburi-ridge.jpg",
  },
  {
    id: "cantonments-luxury",
    name: "The Embassy Enclave",
    location: "Cantonments",
    region: "Accra Central",
    priceStart: "GHS 950,000",
    availablePlots: 5,
    image: "/estates/cantonments-luxury.jpg",
  },
  {
    id: "shai-hills",
    name: "Shai Savanna Reserve",
    location: "Shai Hills",
    region: "Greater Accra",
    priceStart: "GHS 110,000",
    availablePlots: 28,
    image: "/estates/shai-hills.jpg",
  },
  {
    id: "tema-comm-25",
    name: "Emerald Gardens",
    location: "Tema Community 25",
    region: "Greater Accra",
    priceStart: "GHS 140,000",
    availablePlots: 32,
    image: "/estates/tema-community-25.jpg",
  },
];

interface HeroSectionProps {
  onSearchCriteriaChange?: (criteria: SearchCriteria) => void;
}

export function HeroSection({ onSearchCriteriaChange }: HeroSectionProps) {
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
    <section className="relative w-full px-3 pb-8 pt-2 sm:px-6 sm:pb-12 md:px-8">
      <div
        className="relative mx-auto h-[calc(100svh-5rem)] min-h-[600px] max-h-[760px] w-full max-w-7xl overflow-hidden rounded-[1.5rem] border border-border/60 bg-neutral-950 shadow-xl sm:h-[78vh] sm:min-h-[540px] sm:rounded-[2.5rem]"
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
                sizes="(max-width: 1280px) 100vw, 1440px"
                className={`object-cover transition-transform duration-1000 ease-out ${
                  isActive ? "scale-100" : "scale-105"
                }`}
              />
            </div>
          );
        })}

        {/* Cinematic Vignette Overlay for High Legibility & Premium Feel */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/45 pointer-events-none" />

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
        <div className="relative z-20 flex h-full flex-col justify-between p-5 text-white pointer-events-none sm:p-10 md:p-12">
          {/* Top Row: Current Estate Tag & Slide Counter */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 backdrop-blur-md text-xs font-medium text-white shadow">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-brand-gold-400"><HugeiconsIcon icon={Location01Icon} size={14} /></span>
              <span>
                {activeSlide.name} &middot; {activeSlide.location}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-white/80 border-l border-white/20 pl-2">
                <HugeiconsIcon icon={ShieldCheckIcon} size={12} className="text-brand-gold-400" />
                Verified
              </span>
            </div>

            {/* Slide Index Pill */}
            <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1 backdrop-blur-md text-xs font-semibold text-white/90">
              <span>0{currentSlide + 1}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/60">0{HERO_SLIDES.length}</span>
            </div>
          </div>

          {/* Center Minimal Writing & Airbnb Search Capsule */}
          <div className="my-auto mx-auto w-full max-w-4xl text-center px-2 pointer-events-auto">
            {/* Minimal Editorial Headline */}
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl">
              Find your place on the map.
            </h1>

            {/* Minimal Subtext */}
            <p className="mt-3 text-sm sm:text-lg text-white/85 max-w-xl mx-auto drop-shadow font-medium">
              Explore verified estates across Ghana. Transparent plots, direct developers.
            </p>

            {/* Floating Search Capsule */}
            <div className="mt-7 sm:mt-9">
              <SearchCapsule onSearch={onSearchCriteriaChange} />
            </div>
          </div>

          {/* Bottom Slider Indicator Dots */}
          <div className="flex items-center justify-center gap-2 pointer-events-auto">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}: ${slide.name}`}
                className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-8 bg-brand-gold-400 shadow-sm"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
