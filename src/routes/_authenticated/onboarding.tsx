import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { ORG_KEY } from "@/lib/org";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your workspace — Orbit AI" }, { name: "description", content: "Create your company workspace." }] }),
  component: Onboarding,
});

const steps = ["You", "Company", "Workspace", "Done"];

function Onboarding() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ fullName: "", company: "", size: "", industry: "", workspace: "Main workspace", assistant: "Orbit" });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.full_name) setF((s) => ({ ...s, fullName: data.full_name }));
    });
  }, [user.id]);

  async function next() {
    try {
      setBusy(true);
      if (step === 0) {
        if (!f.fullName.trim()) throw new Error("Please enter your name");
        const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: f.fullName.trim() });
        if (error) throw error;
      }
      if (step === 1 && !f.company.trim()) throw new Error("Please enter your company name");
      if (step === 2) {
        const { data, error } = await supabase.rpc("create_organization", {
          _name: f.company, _industry: f.industry, _company_size: f.size, _workspace_name: f.workspace, _assistant_name: f.assistant,
        });
        if (error) throw error;
        localStorage.setItem(ORG_KEY, data as string);
      }
      setStep((s) => s + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-glow px-4 py-10">
      <Logo />
      <div className="mt-10 w-full max-w-lg">
        <div className="mb-6 flex gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full ${i <= step ? "bg-brand" : "bg-muted"}`} />
              <div className={`mt-2 text-xs ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          {step === 0 && (
            <Step title="Tell us about you" desc="This is how teammates will see you.">
              <Field label="Full name"><Input value={f.fullName} onChange={(e) => set("fullName")(e.target.value)} autoFocus /></Field>
            </Step>
          )}
          {step === 1 && (
            <Step title="Your company" desc="Each company gets its own isolated tenant.">
              <Field label="Company name"><Input value={f.company} onChange={(e) => set("company")(e.target.value)} maxLength={120} autoFocus /></Field>
              <Field label="Company size">
                <Select value={f.size} onValueChange={set("size")}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>{["1-10", "11-50", "51-200", "201-1000", "1000+"].map((x) => <SelectItem key={x} value={x}>{x} employees</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Industry">
                <Select value={f.industry} onValueChange={set("industry")}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>{["Technology", "Finance", "Healthcare", "Education", "Retail", "Manufacturing", "Professional services", "Other"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </Step>
          )}
          {step === 2 && (
            <Step title="Configure your workspace" desc="You can change these later in settings.">
              <Field label="Workspace name"><Input value={f.workspace} onChange={(e) => set("workspace")(e.target.value)} /></Field>
              <Field label="AI assistant name"><Input value={f.assistant} onChange={(e) => set("assistant")(e.target.value)} maxLength={40} /></Field>
            </Step>
          )}
          {step === 3 ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-cyan" />
              <h1 className="mt-4 text-2xl font-semibold">Welcome to Orbit AI, {f.fullName.split(" ")[0]}!</h1>
              <p className="mt-2 text-sm text-muted-foreground">{f.company} is ready. {f.assistant} is waiting for your first question.</p>
              <Button variant="hero" className="mt-6" onClick={() => navigate({ to: "/app" })}>Go to dashboard</Button>
            </div>
          ) : (
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>Back</Button>
              <Button variant="hero" onClick={next} disabled={busy}>{busy ? "Saving…" : step === 2 ? "Create workspace" : "Continue"}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (<div><h1 className="text-xl font-semibold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{desc}</p><div className="mt-5 space-y-4">{children}</div></div>);
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
