import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden>
      <defs>
        <linearGradient id="orbit-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--cyan)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="6" fill="url(#orbit-g)" />
      <ellipse cx="16" cy="16" rx="14" ry="6.5" fill="none" stroke="url(#orbit-g)" strokeWidth="1.6" transform="rotate(-28 16 16)" />
    </svg>
  );
}

export function Logo({ to = "/", collapsed = false }: { to?: string; collapsed?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
      <LogoMark />
      {!collapsed && (
        <span>
          Orbit <span className="text-brand">AI</span>
        </span>
      )}
    </Link>
  );
}
