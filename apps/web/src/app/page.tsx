import { LandingNav } from "@/components/home/landing-nav";
import { LandingDiscovery } from "@/components/home/landing-discovery";
import type { EstateListing } from "@/components/home/explore-lands-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { CompanyBanner } from "@/components/home/company-banner";
import { LandingFooter } from "@/components/home/landing-footer";
import { getServerApiClient } from "@/utils/server-orpc";

const ESTATE_IMAGES = ["/estates/east-legon-hills.jpg", "/estates/prampram-coastal.jpg", "/estates/aburi-ridge.jpg", "/estates/shai-hills.jpg"];

export default async function HomePage() {
  let published: Record<string, unknown>[] = [];
  try {
    const api = await getServerApiClient();
    published = await api.land.listPublished({ limit: 24, offset: 0 }) as Record<string, unknown>[];
  } catch {
    // The public page remains usable while the API is temporarily unavailable.
  }
  const estates: EstateListing[] = published.map((estate, index) => ({
    id: String(estate.slug),
    name: String(estate.name),
    location: estate.district ? String(estate.district) : String(estate.region),
    region: String(estate.region),
    category: "Gated Communities",
    image: ESTATE_IMAGES[index % ESTATE_IMAGES.length]!,
    priceStart: estate.priceFrom ? `GHS ${Number(estate.priceFrom).toLocaleString()}` : "Price on request",
    priceNumeric: Number(estate.priceFrom ?? 0),
    availablePlots: Number(estate.availablePlots ?? 0),
    totalPlots: Number(estate.availablePlots ?? 0),
    developer: String(estate.companyName),
    features: "Verified boundary · Surveyed plots",
  }));

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-brand-gold-200 dark:selection:bg-brand-gold-900">
      {/* 1. Floating Capsule Navigation */}
      <LandingNav />

      <main>
        <LandingDiscovery estates={estates} />

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
