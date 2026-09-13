"use client";

import { useState } from "react";
import { HeroSection } from "./hero-section";
import { ExploreLandsSection, type EstateListing } from "./explore-lands-section";
import type { SearchCriteria } from "./search-capsule";

export function LandingDiscovery({ estates }: { estates: EstateListing[] }) {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  return <><HeroSection onSearchCriteriaChange={setSearchCriteria} /><ExploreLandsSection estates={estates} filterCriteria={searchCriteria} /></>;
}
