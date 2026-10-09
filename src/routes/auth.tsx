import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { MailCheck } from "lucide-react";

const search = z.object({ redirect: z.string().optional(), mode: z.enum(["signin", "signup", "forgot"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — Orbit AI" },
      { name: "description", content: "Sign in or create your Orbit AI account." },
      { property: "og:title", content: "Sign in — Orbit AI" },
      { property: "og:description", content: "Access your company's private AI workspace." },
    ],
  }),
  component: AuthPage,
});

function safePath(p?: string) {
  if (!p) return "/app";
  try {
    const u = new URL(p, window.location.origin);
    if (u.origin !== window.location.origin) return "/app";
    return u.pathname + u.search;
  } catch {
    return "/app";
  }
}

function AuthPage() {
  const s = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState(s.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<null | "verify" | "reset">(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: safePath(s.redirect) });
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding`, data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/onboarding" });
        else setSent("verify");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) return toast.error("Google sign-in failed");
    if (r.redirected) return;
    navigate({ to: safePath(s.redirect) });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-glow px-4 py-12">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          {sent ? (
            <div className="space-y-3 text-center">
              <MailCheck className="mx-auto h-10 w-10 text-cyan" />
              <h1 className="text-lg font-semibold">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                {sent === "verify"
                  ? `We sent a verification link to ${email}. Confirm it to set up your workspace.`
                  : `If an account exists for ${email}, a password reset link is on its way.`}
              </p>
              <Button variant="subtle" className="w-full" onClick={() => { setSent(null); setMode("signin"); }}>Back to sign in</Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold">
                {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signin" ? "Sign in to your workspace." : mode === "signup" ? "Start your private AI workspace." : "We'll email you a reset link."}
              </p>
              {mode !== "forgot" && (
                <>
                  <Button variant="subtle" className="mt-5 w-full" onClick={google} type="button">
                    <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.7 4.4-5.35 4.4a5.9 5.9 0 0 1 0-11.8c1.85 0 3.1.8 3.8 1.45l2.6-2.5C16.75 3.95 14.6 3 12 3a9 9 0 1 0 0 18c5.2 0 8.65-3.65 8.65-8.8 0-.6-.05-1.05-.15-1.5Z" /></svg>
                    Continue with Google
                  </Button>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
                </>
              )}
              <form onSubmit={submit} className={mode === "forgot" ? "mt-5 space-y-4" : "space-y-4"}>
                {mode === "signup" && (
                  <div className="space-y-1.5"><Label htmlFor="n">Full name</Label><Input id="n" required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                )}
                <div className="space-y-1.5"><Label htmlFor="e">Work email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="p">Password</Label>
                      {mode === "signin" && <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</button>}
                    </div>
                    <Input id="p" type="password" required minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                )}
                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>New to Orbit AI? <button className="text-foreground hover:underline" onClick={() => setMode("signup")}>Create an account</button></>
                ) : (
                  <>Already have an account? <button className="text-foreground hover:underline" onClick={() => setMode("signin")}>Sign in</button></>
                )}
              </p>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground"><Link to="/" className="hover:text-foreground">← Back to website</Link></p>
      </div>
    </div>
  );
}
