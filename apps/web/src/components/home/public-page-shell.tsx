import Link from "next/link";
import { LandingNav } from "@/components/home/landing-nav";
import { LandingFooter } from "@/components/home/landing-footer";

export function PublicPageShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <div className="min-h-svh bg-background text-foreground"><LandingNav/><main className="mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8 sm:pt-40"><Link href="/" className="text-sm font-semibold text-brand-green-800 hover:underline">← Back to AsaseLink</Link><header className="mt-8 max-w-3xl border-b border-border pb-10"><h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-6xl">{title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{intro}</p></header><div className="mt-10">{children}</div></main><LandingFooter/></div>;
}

export function ProseSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="grid gap-3 border-b border-border py-7 last:border-0 md:grid-cols-[13rem_1fr]"><h2 className="font-semibold">{title}</h2><div className="max-w-2xl space-y-3 text-sm leading-7 text-muted-foreground">{children}</div></section>;
}
