"use client";

import { useState } from "react";
import { HeroSection } from "./hero-section";
import { ExploreLandsSection, type EstateListing } from "./explore-lands-section";

export function LandingDiscovery({ estates }: { estates: EstateListing[] }) {
  const [searchCriteria, setSearchCriteria] = useState<{ location: string; type: string; budget: string } | null>(null);
  return <><HeroSection onSearchCriteriaChange={setSearchCriteria} /><ExploreLandsSection estates={estates} filterCriteria={searchCriteria} /></>;
}
