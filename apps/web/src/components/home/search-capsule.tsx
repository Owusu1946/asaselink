"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Location01Icon,
  Building02Icon,
  Coins01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

const LOCATIONS = [
  { label: "All of Ghana" },
  { label: "East Legon Hills", center: [-0.083, 5.708] as [number, number], region: "Greater Accra", district: "East Legon Hills" },
  { label: "Prampram Coastal", center: [0.113, 5.714] as [number, number], region: "Greater Accra", district: "Prampram" },
  { label: "Aburi Ridge", center: [-0.174, 5.848] as [number, number], region: "Eastern Region", district: "Aburi" },
  { label: "Cantonments", center: [-0.171, 5.577] as [number, number], region: "Greater Accra", district: "Cantonments" },
  { label: "Tema Community 25", center: [0.091, 5.704] as [number, number], region: "Greater Accra", district: "Tema Community 25" },
  { label: "Shai Hills", center: [0.059, 5.91] as [number, number], region: "Greater Accra", district: "Shai Hills" },
];

const ESTATE_TYPES = [
  "All Types",
  "Gated Community",
  "Hillside Retreat",
  "Coastal Living",
  "Urban Luxury",
  "Serviced Plots",
];

const BUDGET_RANGES = [
  "Any Budget",
  "Under GHS 100k",
  "GHS 100k - 250k",
  "GHS 250k - 500k",
  "GHS 500k+",
];

export interface SearchCriteria { location: string; type: string; budget: string; center?: [number, number]; region?: string; district?: string }
interface SearchCapsuleProps {
  onSearch?: (criteria: SearchCriteria) => void;
  initialCriteria?: SearchCriteria | null;
}

export function SearchCapsule({ onSearch, initialCriteria }: SearchCapsuleProps) {
  const [activeTab, setActiveTab] = useState<"location" | "type" | "budget" | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("All of Ghana");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedBudget, setSelectedBudget] = useState("Any Budget");

  React.useEffect(() => {
    if (!initialCriteria) return;
    setSelectedLocation(initialCriteria.location);
    setSelectedType(initialCriteria.type);
    setSelectedBudget(initialCriteria.budget);
  }, [initialCriteria]);

  const handleExecuteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab(null);
    if (onSearch) {
      const selectedPlace = LOCATIONS.find((place) => place.label === selectedLocation);
      onSearch({
        location: selectedLocation,
        type: selectedType,
        budget: selectedBudget,
        center: selectedPlace?.center,
        region: selectedPlace?.region,
        district: selectedPlace?.district,
      });
    }

    // Smooth scroll to explore lands section
    const exploreSection = document.getElementById("explore-lands");
    if (exploreSection) {
      exploreSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl text-foreground">
      {/* Search Capsule Bar */}
      <form
        onSubmit={handleExecuteSearch}
        className="relative flex flex-col overflow-hidden rounded-[1.25rem] border border-white/30 bg-background/95 p-1.5 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:overflow-visible sm:rounded-full sm:p-2"
      >
        {/* Segment 1: Location */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "location" ? null : "location")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab(activeTab === "location" ? null : "location")}
          className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2 text-left transition-colors sm:min-h-0 sm:flex-1 sm:rounded-full sm:px-4 sm:py-2.5 ${
            activeTab === "location" ? "bg-muted/80 ring-1 ring-border" : "hover:bg-muted/50"
          }`}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-brand-green-900 dark:text-brand-green-300">
            <HugeiconsIcon icon={Location01Icon} size={16} />
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-foreground">
              Location
            </span>
            <span className="truncate text-xs text-muted-foreground font-medium">
              {selectedLocation}
            </span>
          </div>
        </button>

        {/* Separator */}
        <div className="mx-3 h-px w-[calc(100%-1.5rem)] bg-border/70 sm:mx-0 sm:block sm:h-8 sm:w-px" />

        {/* Segment 2: Layout Type */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "type" ? null : "type")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab(activeTab === "type" ? null : "type")}
          className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2 text-left transition-colors sm:min-h-0 sm:flex-1 sm:rounded-full sm:px-4 sm:py-2.5 ${
            activeTab === "type" ? "bg-muted/80 ring-1 ring-border" : "hover:bg-muted/50"
          }`}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-brand-green-900 dark:text-brand-green-300">
            <HugeiconsIcon icon={Building02Icon} size={16} />
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-foreground">
              Layout
            </span>
            <span className="truncate text-xs text-muted-foreground font-medium">
              {selectedType}
            </span>
          </div>
        </button>

        {/* Separator */}
        <div className="mx-3 h-px w-[calc(100%-1.5rem)] bg-border/70 sm:mx-0 sm:block sm:h-8 sm:w-px" />

        {/* Segment 3: Budget */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "budget" ? null : "budget")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab(activeTab === "budget" ? null : "budget")}
          className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2 text-left transition-colors sm:min-h-0 sm:flex-1 sm:rounded-full sm:px-4 sm:py-2.5 ${
            activeTab === "budget" ? "bg-muted/80 ring-1 ring-border" : "hover:bg-muted/50"
          }`}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-brand-green-900 dark:text-brand-green-300">
            <HugeiconsIcon icon={Coins01Icon} size={16} />
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-foreground">
              Budget
            </span>
            <span className="truncate text-xs text-muted-foreground font-medium">
              {selectedBudget}
            </span>
          </div>
        </button>

        {/* Search Action Button */}
        <div className="w-full p-1 pt-1.5 sm:w-auto sm:pt-1">
          <button
            type="submit"
            aria-label="Search estates"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-green-900 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-green-800 active:bg-brand-green-950 sm:aspect-square sm:min-h-11 sm:w-auto sm:rounded-full sm:px-0 dark:bg-brand-green-600 dark:text-brand-black dark:hover:bg-brand-green-500"
          >
            <HugeiconsIcon icon={Search01Icon} size={18} />
            <span className="sm:hidden">Search estates</span>
          </button>
        </div>
      </form>

      {/* Popover Dropdown Panels */}
      {activeTab && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2.5 max-h-[42svh] overflow-y-auto rounded-2xl border border-border bg-background p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:max-h-none sm:rounded-3xl sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              {activeTab === "location" && "Select a region or district"}
              {activeTab === "type" && "Select estate development layout"}
              {activeTab === "budget" && "Select price range in GHS"}
            </h4>
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-2">
            {activeTab === "location" &&
              LOCATIONS.map((loc) => (
                <button
                  key={loc.label}
                  type="button"
                  onClick={() => {
                    setSelectedLocation(loc.label);
                    setActiveTab(null);
                  }}
                  className={`min-h-10 rounded-full px-3.5 py-2 text-xs font-medium transition-all ${
                    selectedLocation === loc.label
                      ? "bg-brand-green-900 text-white dark:bg-brand-green-600 dark:text-brand-black"
                      : "border border-border bg-muted/40 text-foreground hover:bg-muted"
                  }`}
                >
                  {loc.label}
                </button>
              ))}

            {activeTab === "type" &&
              ESTATE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                    setActiveTab(null);
                  }}
                  className={`min-h-10 rounded-full px-3.5 py-2 text-xs font-medium transition-all ${
                    selectedType === type
                      ? "bg-brand-green-900 text-white dark:bg-brand-green-600 dark:text-brand-black"
                      : "border border-border bg-muted/40 text-foreground hover:bg-muted"
                  }`}
                >
                  {type}
                </button>
              ))}

            {activeTab === "budget" &&
              BUDGET_RANGES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    setSelectedBudget(b);
                    setActiveTab(null);
                  }}
                  className={`min-h-10 rounded-full px-3.5 py-2 text-xs font-medium transition-all ${
                    selectedBudget === b
                      ? "bg-brand-green-900 text-white dark:bg-brand-green-600 dark:text-brand-black"
                      : "border border-border bg-muted/40 text-foreground hover:bg-muted"
                  }`}
                >
                  {b}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
