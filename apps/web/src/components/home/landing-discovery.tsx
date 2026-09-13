"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { HeroSection } from "./hero-section";
import { ExploreLandsSection, type EstateListing } from "./explore-lands-section";
import type { SearchCriteria } from "./search-capsule";
import { client } from "@/utils/orpc";

export function LandingDiscovery({ estates }: { estates: EstateListing[] }) {
  const { isSignedIn } = useAuth();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const location = params.get("location");
    const type = params.get("type");
    const budget = params.get("budget");
    if (location && type && budget) setSearchCriteria({ location, type, budget });
  }, []);
  const handleSearch = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    if (isSignedIn) {
      void client.buyer.recordExploration({ location: criteria.location, type: criteria.type, budget: criteria.budget })
        .then(() => window.dispatchEvent(new Event("asaselink:buyer-data-changed")))
        .catch(() => undefined);
    }
  };
  return <><HeroSection onSearchCriteriaChange={handleSearch} initialSearchCriteria={searchCriteria} /><ExploreLandsSection estates={estates} filterCriteria={searchCriteria} /></>;
}
