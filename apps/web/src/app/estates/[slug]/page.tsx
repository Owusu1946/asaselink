import type { Metadata } from "next";
import type { Geometry } from "geojson";
import { notFound } from "next/navigation";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { LandingNav } from "@/components/home/landing-nav";
import { LandingFooter } from "@/components/home/landing-footer";
import { EstateDetailClient } from "@/components/estates/estate-detail-client";
import type { PublicPlot } from "@/components/estates/estate-plot-map";
import { getPublicServerApiClient } from "@/utils/public-server-orpc";
import ApiProvider from "@/components/api-provider";

const getCachedEstate = unstable_cache(async (slug: string) => {
  const api = getPublicServerApiClient();
  return api.land.getPublished({ slug }) as Promise<Record<string, unknown>>;
}, ["published-estate"], { revalidate: 300 });

const getEstate = cache(async (slug: string) => {
  try { return await getCachedEstate(slug); }
  catch { notFound(); }
});

export async function generateStaticParams() {
  try {
    const api = getPublicServerApiClient();
    const estates = await api.land.listPublished({ limit: 48, offset: 0 }) as Record<string, unknown>[];
    return estates.map((estate) => ({ slug: String(estate.slug) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const estate = await getEstate(slug);
  return { title: `${String(estate.name)} | AsaseLink`, description: String(estate.description ?? `Explore verified plots in ${String(estate.name)}.`) };
}

export default async function EstatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const estate = await getEstate(slug);
  const plots = estate.plots as PublicPlot[];
  const available = plots.filter((plot) => plot.status === "AVAILABLE").length;
  return <div className="min-h-svh bg-background text-foreground"><LandingNav /><main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8"><div className="mb-7 max-w-3xl"><p className="text-sm font-medium text-brand-green-800 dark:text-brand-green-300">Verified estate by {String(estate.companyName)}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">{String(estate.name)}</h1><p className="mt-3 text-base leading-7 text-muted-foreground">{String(estate.description ?? "Explore surveyed plots directly on the registered estate boundary.")}</p><div className="mt-4 flex flex-wrap gap-2 text-sm"><span className="rounded-full border border-border px-3 py-1.5">{estate.district ? `${String(estate.district)}, ` : ""}{String(estate.region)}</span><span className="rounded-full border border-border px-3 py-1.5">{available} available plots</span></div></div><ApiProvider clerkEnabled><EstateDetailClient slug={slug} boundary={estate.boundary as Geometry} plots={plots} /></ApiProvider></main><LandingFooter /></div>;
}
