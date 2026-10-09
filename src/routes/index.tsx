import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2, Check, FileText, KeyRound, Lock, Menu, MessageSquare, Shield, ShieldCheck, Sparkles, Users, X, BarChart3, Database, Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/Logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orbit AI — Your Company's Knowledge. Your Own AI Space." },
      { name: "description", content: "Private, isolated AI workspaces for every company. Chat securely with internal documents and collaborate with your team." },
      { property: "og:title", content: "Orbit AI — Your Company's Knowledge. Your Own AI Space." },
      { property: "og:description", content: "Give every team a private AI workspace to securely chat with company knowledge." },
    ],
  }),
  component: Landing,
});

const nav = [
  ["Features", "#features"],
  ["Security", "#security"],
  ["How it works", "#how"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
] as const;

function Landing() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            {nav.map(([l, h]) => <a key={h} href={h} className="hover:text-foreground">{l}</a>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
            <Button variant="hero" asChild><Link to="/auth" search={{ mode: "signup" }}>Get Started</Link></Button>
          </div>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="border-t px-5 py-4 md:hidden">
            {nav.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block py-2 text-sm text-muted-foreground">{l}</a>)}
            <div className="mt-3 flex gap-2">
              <Button variant="subtle" asChild className="flex-1"><Link to="/auth">Sign in</Link></Button>
              <Button variant="hero" asChild className="flex-1"><Link to="/auth" search={{ mode: "signup" }}>Get Started</Link></Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-glow">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 text-center md:pt-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan" /> Tenant-isolated by design
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Your Company's Knowledge. <span className="text-brand">Your Own AI Space.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Give every team a private AI workspace to securely chat with company knowledge, collaborate with colleagues, and get answers from internal documents.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="hero" size="lg" asChild><Link to="/auth" search={{ mode: "signup" }}>Get Started</Link></Button>
            <Button variant="subtle" size="lg" asChild><a href="#features">Explore Features</a></Button>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* Description */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-cyan">The product</p>
        <h2 className="mt-3 text-3xl font-semibold md:text-4xl">One platform. Many companies. Zero data leakage.</h2>
        <p className="mt-4 text-muted-foreground">
          Orbit AI gives each organization a sealed workspace with its own members, conversations, knowledge base, AI configuration and usage analytics — all enforced at the database level, not just in the interface.
        </p>
      </section>

      <Section id="features" eyebrow="Features" title="Everything your team needs to work with AI">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [MessageSquare, "Private AI chat", "Persistent conversations grounded in your company's knowledge."],
            [FileText, "Knowledge base", "Upload docs and let your assistant answer from them."],
            [Users, "Team workspaces", "Invite colleagues with owner, admin, member or viewer roles."],
            [Bot, "Custom assistant", "Name your assistant and shape its behavior per company."],
            [BarChart3, "Usage insights", "Track messages, uploads and adoption across the team."],
            [Building2, "Multi-company", "Belong to several organizations and switch in one click."],
          ].map(([Icon, t, d]) => <Feature key={t as string} Icon={Icon as typeof Users} title={t as string} desc={d as string} />)}
        </div>
      </Section>

      <Section id="security" eyebrow="Security" title="Isolation enforced where it matters — in the database">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [Database, "Row-level security", "Every table is scoped by organization. Changing a URL or ID never reveals another company's data."],
            [Lock, "Private file storage", "Documents live in private, tenant-scoped storage. Every download is authorized."],
            [KeyRound, "Role-based access", "Users can't promote themselves. Only owners and admins manage membership."],
            [Shield, "Server-side AI", "AI keys never touch the browser. Requests are verified before reaching the model."],
          ].map(([Icon, t, d]) => <Feature key={t as string} Icon={Icon as typeof Users} title={t as string} desc={d as string} />)}
        </div>
      </Section>

      <Section id="how" eyebrow="How it works" title="Up and running in minutes">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["01", "Create your workspace", "Sign up, name your company and configure your assistant."],
            ["02", "Add knowledge & team", "Upload documents and invite colleagues with the right roles."],
            ["03", "Ask anything", "Chat with an AI that knows your company — and only yours."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl border bg-card p-6">
              <div className="font-display text-sm text-brand">{n}</div>
              <h3 className="mt-3 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="pricing" eyebrow="Pricing" title="Simple plans that scale with you">
        <p className="-mt-6 mb-10 text-center text-xs text-muted-foreground">Illustrative prices — billing is not yet enabled.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Starter", price: "$29", note: "per workspace / month", items: ["Up to 5 members", "1,000 AI messages / mo", "100 documents", "Email support"] },
            { name: "Business", price: "$149", note: "per workspace / month", items: ["Up to 50 members", "20,000 AI messages / mo", "Unlimited documents", "Role-based access", "Priority support"], featured: true },
            { name: "Enterprise", price: "Custom", note: "annual agreement", items: ["Unlimited members", "Custom AI limits", "SSO & audit logs", "Dedicated success manager"] },
          ].map((p) => (
            <div key={p.name} className={`relative rounded-2xl border p-6 ${p.featured ? "border-primary/60 bg-accent/40" : "bg-card"}`}>
              {p.featured && <span className="absolute -top-3 left-6 rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-primary-foreground">Most popular</span>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-2"><span className="font-display text-4xl font-semibold">{p.price}</span></div>
              <p className="text-xs text-muted-foreground">{p.note} · illustrative</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.items.map((i) => <li key={i} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-cyan" />{i}</li>)}
              </ul>
              <Button variant={p.featured ? "hero" : "subtle"} className="mt-6 w-full" asChild><Link to="/auth" search={{ mode: "signup" }}>Get Started</Link></Button>
            </div>
          ))}
        </div>
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Frequently asked questions">
        <Accordion type="single" collapsible className="mx-auto max-w-2xl">
          {[
            ["Can another company see our data?", "No. Every record is tied to an organization and protected by database-level row security. Access requires verified membership."],
            ["Which files can I upload?", "PDFs, Word docs and more can be stored securely. Text-based files (TXT, Markdown, CSV, JSON) are indexed so the assistant can answer from them."],
            ["Who can invite or remove members?", "Owners and admins. Admins can manage members and viewers; only owners can promote admins."],
            ["Is my data used to train models?", "Your workspace content is only sent to the model to answer your request."],
            ["Can I belong to more than one company?", "Yes — switch between organizations from the sidebar at any time."],
          ].map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </Section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2"><LogoMark className="h-5 w-5" /> © {new Date().getFullYear()} Orbit AI</div>
          <div className="flex gap-6">{nav.map(([l, h]) => <a key={h} href={h} className="hover:text-foreground">{l}</a>)}</div>
        </div>
      </footer>
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <p className="text-center text-sm font-medium uppercase tracking-widest text-cyan">{eyebrow}</p>
      <h2 className="mx-auto mb-12 mt-3 max-w-2xl text-center text-3xl font-semibold md:text-4xl">{title}</h2>
      {children}
    </section>
  );
}

function Feature({ Icon, title, desc }: { Icon: typeof Users; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent"><Icon className="h-5 w-5 text-cyan" /></div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="mx-auto mt-16 max-w-5xl rounded-2xl border bg-surface p-2 text-left shadow-card">
      <div className="flex overflow-hidden rounded-xl border bg-background">
        <aside className="hidden w-48 shrink-0 border-r bg-sidebar p-3 sm:block">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><LogoMark className="h-5 w-5" />Acme Corp</div>
          {["Dashboard", "Chat", "Documents", "Members", "Settings"].map((x, i) => (
            <div key={x} className={`mb-1 rounded-md px-2 py-1.5 text-xs ${i === 1 ? "bg-sidebar-accent text-foreground" : "text-muted-foreground"}`}>{x}</div>
          ))}
        </aside>
        <div className="flex-1 p-4 sm:p-6">
          <div className="grid grid-cols-3 gap-3">
            {[["Messages", "12.4k"], ["Documents", "318"], ["Members", "42"]].map(([l, v]) => (
              <div key={l} className="rounded-lg border bg-card p-3"><div className="text-[10px] text-muted-foreground sm:text-xs">{l}</div><div className="font-display text-lg font-semibold sm:text-xl">{v}</div></div>
            ))}
          </div>
          <div className="mt-4 space-y-3 rounded-lg border bg-card p-4">
            <div className="ml-auto w-fit max-w-[80%] rounded-xl bg-primary/20 px-3 py-2 text-xs">What's our refund policy for annual plans?</div>
            <div className="flex gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand"><Sparkles className="h-3 w-3 text-primary-foreground" /></div>
              <div className="max-w-[85%] rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                Per <span className="text-cyan">Billing-Policy.md</span>, annual plans can be refunded pro-rata within 30 days of renewal…
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
