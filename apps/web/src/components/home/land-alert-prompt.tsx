"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle02Icon, Location01Icon, Notification01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";
import type { SearchCriteria } from "./search-capsule";

function budgetValues(budget: string) {
  if (budget === "Under GHS 100k") return { maxPrice: 100000 };
  if (budget === "GHS 100k - 250k") return { minPrice: 100000, maxPrice: 250000 };
  if (budget === "GHS 250k - 500k") return { minPrice: 250000, maxPrice: 500000 };
  if (budget === "GHS 500k+") return { minPrice: 500000 };
  return {};
}

export function LandAlertPrompt({ criteria }: { criteria: SearchCriteria }) {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [frequency, setFrequency] = useState<"instant" | "daily">("instant");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!isSignedIn) {
      sessionStorage.setItem("asaselink.pending-land-alert", JSON.stringify(criteria));
      window.location.assign(`/sign-in?return_url=${encodeURIComponent("/#explore-lands")}`);
      return;
    }
    if (!email && !sms) { notify.error("Choose email or SMS."); return; }
    startTransition(async () => {
      try {
        await client.alerts.create({ locationLabel: criteria.location, region: criteria.region, district: criteria.district, center: criteria.center, radiusKm, channels: [...(email ? ["email" as const] : []), ...(sms ? ["sms" as const] : [])], frequency, ...budgetValues(criteria.budget) });
        window.dispatchEvent(new Event("asaselink:buyer-data-changed"));
        setCreated(true);
        notify.success("Land alert created", { description: "Mock notifications are ready for matching plots." });
      } catch (cause) { notify.apiError(cause, "Land alert could not be created"); }
    });
  }

  return <>
    <div className="mx-auto mt-6 flex max-w-xl flex-col items-center rounded-2xl bg-brand-green-50/70 p-5 text-center dark:bg-brand-green-950/30 sm:flex-row sm:text-left">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-green-900 text-white"><HugeiconsIcon icon={Notification01Icon} size={20} /></span>
      <div className="mt-3 flex-1 sm:ml-4 sm:mt-0"><p className="text-sm font-semibold">Want us to watch this area?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">We’ll match newly available plots around {criteria.location} within your selected budget.</p></div>
      <Button type="button" size="sm" className="mt-4 rounded-xl sm:ml-4 sm:mt-0" onClick={() => { setOpen(true); setCreated(false); }}>Create alert</Button>
    </div>
    {open ? <div className="fixed inset-0 z-[90] grid place-items-end bg-black/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="land-alert-title" className="w-full max-w-lg rounded-t-3xl bg-background p-6 shadow-2xl sm:rounded-3xl sm:p-7">
      {created ? <div className="py-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-green-100 text-brand-green-900"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} /></span><h2 id="land-alert-title" className="mt-4 text-2xl font-semibold">We’re watching {criteria.location}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Matching is active. Email and SMS delivery are simulated during this build.</p><Button className="mt-6 rounded-xl" onClick={() => setOpen(false)}>Done</Button></div> : <>
        <header className="flex items-start justify-between gap-4"><div><span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-green-800"><HugeiconsIcon icon={Location01Icon} size={14} />{criteria.location}</span><h2 id="land-alert-title" className="mt-2 text-2xl font-semibold tracking-tight">Tell me when land is available</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">You control the area, budget and how often we notify you.</p></div><button type="button" onClick={() => setOpen(false)} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-muted" aria-label="Close"><HugeiconsIcon icon={Cancel01Icon} size={19} /></button></header>
        <div className="mt-6 space-y-5"><label className="block text-sm font-medium">Search radius <span className="float-right text-muted-foreground">{radiusKm} km</span><input type="range" min="2" max="50" step="1" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} className="mt-3 w-full accent-brand-green-900" /></label><div><p className="text-sm font-medium">Notify me by</p><div className="mt-2 grid grid-cols-2 gap-2"><Channel checked={email} onChange={setEmail} label="Email" /><Channel checked={sms} onChange={setSms} label="SMS" /></div><p className="mt-2 text-xs text-muted-foreground">Delivery is mocked for now; matches are still recorded.</p></div><div><p className="text-sm font-medium">Frequency</p><div className="mt-2 grid grid-cols-2 gap-2">{(["instant", "daily"] as const).map((value) => <button type="button" key={value} onClick={() => setFrequency(value)} className={`rounded-xl border p-3 text-left text-sm ${frequency === value ? "border-brand-green-900 bg-brand-green-50 text-brand-green-950" : "border-border"}`}><strong className="block capitalize">{value}</strong><span className="mt-0.5 block text-xs text-muted-foreground">{value === "instant" ? "As soon as a plot matches" : "One concise daily summary"}</span></button>)}</div></div><div className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Your filter:</strong> {criteria.budget === "Any Budget" ? "Any price" : criteria.budget} · within {radiusKm} km of {criteria.location}</div></div>
        <Button className="mt-6 h-12 w-full rounded-xl" onClick={save} disabled={pending}>{pending ? "Creating alert…" : isSignedIn ? "Create land alert" : "Sign in to create alert"}</Button>
      </>}
    </section></div> : null}
  </>;
}

function Channel({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium ${checked ? "border-brand-green-900 bg-brand-green-50 text-brand-green-950" : "border-border"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-brand-green-900" />{label}<span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Mock</span></label>;
}
