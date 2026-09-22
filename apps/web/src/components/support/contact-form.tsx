"use client";

import { useState, useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

export function ContactForm() {
  const [pending, startTransition] = useTransition(); const [reference, setReference] = useState("");
  function submit(formData: FormData) { startTransition(async()=>{ try { const result = await client.support.create({ name:String(formData.get("name")), email:String(formData.get("email")), subject:String(formData.get("subject")), message:String(formData.get("message")), website:String(formData.get("website") ?? "") }); setReference(String(result?.reference)); notify.success("Message received",{description:`Keep reference ${String(result?.reference)} for follow-up.`}); } catch(error){ notify.apiError(error,"Message could not be sent"); } }); }
  if(reference) return <div className="rounded-2xl border border-brand-green-800/20 bg-brand-green-50 p-7 dark:bg-brand-green-950/30"><h2 className="text-xl font-semibold">We received your message</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Our support team will reply by email. Your reference is <strong className="text-foreground">{reference}</strong>.</p><Button className="mt-5" variant="outline" onClick={()=>setReference("")}>Send another message</Button></div>;
  return <form action={submit} className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-7"><div className="grid gap-5 sm:grid-cols-2"><Field label="Name" name="name" autoComplete="name"/><Field label="Email" name="email" type="email" autoComplete="email"/></div><Field label="Subject" name="subject"/><label className="block text-sm font-medium">How can we help?<textarea required minLength={20} maxLength={4000} name="message" rows={6} className="mt-2 w-full resize-y rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-ring" placeholder="Include an estate, plot, reservation or payment reference when relevant."/></label><input name="website" className="hidden" tabIndex={-1} autoComplete="off"/><Button disabled={pending} className="h-11 w-full sm:w-auto">{pending?"Sending…":"Send message"}</Button></form>;
}
function Field({label,name,type="text",autoComplete}:{label:string;name:string;type?:string;autoComplete?:string}){return <label className="block text-sm font-medium">{label}<input required minLength={2} maxLength={256} name={name} type={type} autoComplete={autoComplete} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-ring"/></label>}
