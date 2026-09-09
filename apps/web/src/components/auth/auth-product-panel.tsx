import Link from "next/link";
import { ParcelMotif } from "./parcel-motif";

export function AuthProductPanel() {
  return (
    <aside
      aria-label="AsaseLink Product Overview"
      className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-brand-green-900 text-brand-white p-10 xl:p-14 selection:bg-brand-gold-400 selection:text-brand-green-950"
    >
      {/* Subtle brand ambient gradient overlay (restrained, no purple/blue) */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-green-950/40 via-transparent to-brand-green-950/60"
        aria-hidden="true"
      />

      {/* Header: Brand wordmark */}
      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight text-brand-white hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-500 rounded-lg p-1 -m-1"
        >
          <span
            className="h-3.5 w-3.5 rounded-full bg-brand-gold-500 ring-2 ring-brand-green-800"
            aria-hidden="true"
          />
          <span>
            Asase<span className="text-brand-gold-300">Link</span>
          </span>
        </Link>
      </div>

      {/* Center: Brand statement & parcel motif */}
      <div className="relative z-10 my-auto py-10 max-w-md">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-brand-gold-200 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-gold-400" />
          Verified Land Registry
        </div>

        <h2 className="text-2xl xl:text-3xl font-semibold tracking-tight text-brand-white text-balance leading-tight">
          Where land decisions are backed by spatial truth.
        </h2>

        <p className="mt-3 text-sm text-brand-green-100/80 leading-relaxed">
          Explore estate plots with coordinate validation, track title verification status, and
          secure reservation rights with clarity.
        </p>

        <div className="mt-8 flex justify-center">
          <ParcelMotif className="w-full max-w-sm" />
        </div>
      </div>

      {/* Footer: Trust commitment */}
      <div className="relative z-10 border-t border-white/10 pt-6 text-xs text-brand-green-200/70 flex items-center justify-between">
        <span>Cadastral Survey Standard</span>
        <span>Ghana Land Commission Aligned</span>
      </div>
    </aside>
  );
}
