"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useBrain } from "@/components/brain/BrainStore";
import { useCapture } from "@/components/capture/CaptureSheet";
import { Card } from "@/components/shell/Card";
import { Wordmark } from "@/components/shell/Wordmark";
import { mappedShare } from "@/lib/brain/heat";

/** Small line icons, drawn in the current colour, one per module. */
const ICONS: Record<string, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />,
  brain: (
    <>
      <circle cx="7" cy="9" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="17" cy="9" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="9" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  studio: <path d="M4 20h16M6 16 16.5 5.5a2 2 0 0 1 2.8 2.8L8.8 18.8 4.5 19.5z" />,
  calendar: <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4" />,
  insights: <path d="M4 20V11M10 20V5M16 20v-8M22 20H2" />,
};

const MODULES = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/brain", label: "Brain", icon: "brain" },
  { href: "/studio", label: "Studio", icon: "studio" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/insights", label: "Insights", icon: "insights" },
];

function Icon({ name }: { name: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

/**
 * The left column: a stack of cards. Logo, navigation, how mapped the brain is, then
 * "Tell me something" and the account at the bottom.
 */
export function SideNav({ initials }: { initials: string }) {
  const pathname = usePathname();
  const capture = useCapture();
  const { brain } = useBrain();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);
  // The deep dive and the quiz are blank rooms.
  if (pathname.startsWith("/deep-dive") || pathname.startsWith("/engine")) return null;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const mapped = Math.round(mappedShare(brain) * 100);

  return (
    <aside className="flex shrink-0 flex-col gap-3 p-3 lg:sticky lg:top-0 lg:h-screen lg:w-[232px] lg:p-4">
      <Card className="flex items-center justify-between gap-3 lg:justify-start" pad={4}>
        <Link href="/" aria-label="Noggin home" className="shrink-0">
          <Wordmark height={24} />
        </Link>
        {/* On small screens the account sits in the logo card so the stack stays short. */}
        <div className="lg:hidden">
          <Account initials={initials} />
        </div>
      </Card>

      <Card as="nav" pad={3} className="min-w-0">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Modules">
          {MODULES.map((m) => {
            const active = isActive(m.href);
            return (
              <li key={m.href} className="shrink-0">
                <Link
                  href={m.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-btn px-3 py-2 text-sm whitespace-nowrap ${
                    active ? "bg-highlight font-medium text-ink" : "text-secondary hover:bg-ground hover:text-ink"
                  }`}
                >
                  <Icon name={m.icon} />
                  <span className="hidden sm:inline">{m.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card pad={4} className="hidden lg:block">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span>Your noggin</span>
          <span className="font-medium tabular-nums">{mapped}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hairline" role="progressbar" aria-valuenow={mapped} aria-valuemin={0} aria-valuemax={100} aria-label="How mapped your brain is">
          <div className="h-full rounded-full bg-brand" style={{ width: `${mapped}%` }} />
        </div>
        <p className="mt-2 text-xs text-secondary">mapped so far</p>
      </Card>

      <div className="hidden flex-1 lg:block" />

      <button
        type="button"
        onClick={capture.open}
        className="hidden items-center justify-center gap-2.5 rounded-card bg-ink px-4 py-3 text-sm font-medium text-highlight hover:bg-signal lg:flex"
      >
        <span aria-hidden className="h-2 w-2 rounded-full bg-brand" />
        Tell me something
      </button>

      <Card pad={3} className="hidden lg:block">
        <Account initials={initials} withName />
      </Card>
    </aside>
  );

  function Account({ initials, withName = false }: { initials: string; withName?: boolean }) {
    return (
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="Account menu"
          aria-expanded={menu}
          onClick={() => setMenu((m) => !m)}
          className="flex w-full items-center gap-3 rounded-btn px-1 py-1 text-left hover:bg-ground"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-highlight text-xs font-medium text-ink">{initials}</span>
          {withName && (
            <span className="min-w-0">
              <span className="block truncate text-sm">{brain.ownerName}</span>
              <span className="block text-xs text-secondary">Account</span>
            </span>
          )}
        </button>
        {menu && (
          <div className="absolute bottom-full left-0 z-40 mb-2 w-44 rounded-card border border-hairline bg-card py-1" role="menu">
            <Link href="/settings" role="menuitem" className="block px-3 py-2 text-sm text-secondary hover:bg-ground hover:text-ink" onClick={() => setMenu(false)}>
              Settings
            </Link>
            <Link href="/settings/linkedin" role="menuitem" className="block px-3 py-2 text-sm text-secondary hover:bg-ground hover:text-ink" onClick={() => setMenu(false)}>
              LinkedIn
            </Link>
            <button type="button" role="menuitem" className="block w-full px-3 py-2 text-left text-sm text-secondary hover:bg-ground hover:text-ink" onClick={() => setMenu(false)}>
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }
}
