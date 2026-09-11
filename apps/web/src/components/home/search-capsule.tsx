"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Location01Icon,
  Building02Icon,
  Coins01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

const LOCATIONS = [
  "All of Ghana",
  "East Legon Hills",
  "Prampram Coastal",
  "Aburi Ridge",
  "Cantonments",
  "Tema Community 25",
  "Shai Hills",
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

interface SearchCapsuleProps {
  onSearch?: (criteria: { location: string; type: string; budget: string }) => void;
}

export function SearchCapsule({ onSearch }: SearchCapsuleProps) {
  const [activeTab, setActiveTab] = useState<"location" | "type" | "budget" | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("All of Ghana");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedBudget, setSelectedBudget] = useState("Any Budget");

  const handleExecuteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab(null);
    if (onSearch) {
      onSearch({
        location: selectedLocation,
        type: selectedType,
        budget: selectedBudget,
      });
    }

    // Smooth scroll to explore lands section
    const exploreSection = document.getElementById("explore-lands");
    if (exploreSection) {
      exploreSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Search Capsule Bar */}
      <form
        onSubmit={handleExecuteSearch}
        className="relative flex flex-col sm:flex-row items-center rounded-3xl sm:rounded-full border border-border/90 bg-background/95 p-1.5 sm:p-2 shadow-[0_6px_24px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      >
        {/* Segment 1: Location */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab(activeTab === "location" ? null : "location")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab(activeTab === "location" ? null : "location")}
          className={`flex w-full sm:flex-1 cursor-pointer items-center gap-3 rounded-2xl sm:rounded-full px-4 py-2.5 transition-colors ${
            activeTab === "location" ? "bg-muted/80 ring-1 ring-border" : "hover:bg-muted/50"
          }`}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-green-50 text-brand-green-800 dark:bg-brand-green-950 dark:text-brand-green-300">
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
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-8 w-px bg-border/80" />

        {/* Segment 2: Layout Type */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab(activeTab === "type" ? null : "type")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab(activeTab === "type" ? null : "type")}
          className={`flex w-full sm:flex-1 cursor-pointer items-center gap-3 rounded-2xl sm:rounded-full px-4 py-2.5 transition-colors ${
            activeTab === "type" ? "bg-muted/80 ring-1 ring-border" : "hover:bg-muted/50"
          }`}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-gold-50 text-brand-gold-800 dark:bg-brand-gold-950 dark:text-brand-gold-300">
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
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-8 w-px bg-border/80" />

        {/* Segment 3: Budget */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab(activeTab === "budget" ? null : "budget")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab(activeTab === "budget" ? null : "budget")}
          className={`flex w-full sm:flex-1 cursor-pointer items-center gap-3 rounded-2xl sm:rounded-full px-4 py-2.5 transition-colors ${
            activeTab === "budget" ? "bg-muted/80 ring-1 ring-border" : "hover:bg-muted/50"
          }`}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
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
        </div>

        {/* Search Action Button */}
        <div className="w-full sm:w-auto p-1">
          <button
            type="submit"
            aria-label="Search estates"
            className="flex h-11 w-full sm:w-auto sm:aspect-square sm:px-0 items-center justify-center gap-2 rounded-full bg-brand-green-900 px-5 text-white shadow transition-all hover:bg-brand-green-800 hover:scale-[1.02] active:scale-[0.98] dark:bg-brand-green-600 dark:text-brand-black dark:hover:bg-brand-green-500"
          >
            <HugeiconsIcon icon={Search01Icon} size={18} />
            <span className="sm:hidden text-xs font-semibold">Search estates</span>
          </button>
        </div>
      </form>

      {/* Popover Dropdown Panels */}
      {activeTab && (
        <div className="absolute left-0 right-0 top-full mt-2.5 z-30 rounded-3xl border border-border bg-background/98 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              {activeTab === "location" && "Select a region or district"}
              {activeTab === "type" && "Select estate development layout"}
              {activeTab === "budget" && "Select price range in GHS"}
            </h4>
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-2">
            {activeTab === "location" &&
              LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setSelectedLocation(loc);
                    setActiveTab(null);
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    selectedLocation === loc
                      ? "bg-brand-green-900 text-white dark:bg-brand-green-600 dark:text-brand-black"
                      : "border border-border bg-muted/40 text-foreground hover:bg-muted"
                  }`}
                >
                  {loc}
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
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
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
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
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
