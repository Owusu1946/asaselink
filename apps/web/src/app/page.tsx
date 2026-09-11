"use client";

import { useState } from "react";
import { LandingNav } from "@/components/home/landing-nav";
import { HeroSection } from "@/components/home/hero-section";
import { ExploreLandsSection } from "@/components/home/explore-lands-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { CompanyBanner } from "@/components/home/company-banner";
import { LandingFooter } from "@/components/home/landing-footer";

export default function HomePage() {
  const [searchCriteria, setSearchCriteria] = useState<{
    location: string;
    type: string;
    budget: string;
  } | null>(null);

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-brand-gold-200 dark:selection:bg-brand-gold-900">
      {/* 1. Floating Capsule Navigation */}
      <LandingNav />

      <main>
        {/* 2. Asymmetric Hero Section with Interactive Spatial Map & Search Bar */}
        <HeroSection onSearchCriteriaChange={setSearchCriteria} />

        {/* 3. Image-Driven "Explore Lands" Grid with Filters */}
        <ExploreLandsSection filterCriteria={searchCriteria} />

        {/* 4. The AsaseLink Standard / How It Works */}
        <HowItWorksSection />

        {/* 5. Company Acquisition Banner (Host equivalent) */}
        <CompanyBanner />
      </main>

      {/* 6. Editorial Footer */}
      <LandingFooter />
    </div>
  );
}
