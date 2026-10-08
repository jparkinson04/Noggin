"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCapture } from "@/components/capture/CaptureSheet";
import { useEffect, useRef, useState } from "react";

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

/** The left rail: wordmark, the four modules with an icon each, capture, and the person. Nothing else. */
export function SideNav({ initials }: { initials: string }) {
  const pathname = usePathname();
  const capture = useCapture();
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

  return (
    <aside className="flex shrink-0 items-center gap-4 border-b border-hairline px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:w-[220px] lg:flex-col lg:items-stretch lg:gap-0 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <Link href="/" aria-label="Noggin home" className="shrink-0 lg:mb-10 lg:px-2">
        <img src="/logo-dark.svg" alt="" className="h-[26px] w-auto" />
      </Link>

      <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Modules">
        {MODULES.map((m) => {
          const active = isActive(m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-btn px-2 py-2 text-sm whitespace-nowrap ${
                active ? "text-ink" : "text-secondary hover:text-ink"
              }`}
            >
              <Icon name={m.icon} />
              <span className="hidden sm:inline">{m.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-3 lg:mt-auto lg:flex-col lg:items-stretch lg:gap-4">
        <button
          type="button"
          aria-label="Tell me something"
          onClick={capture.open}
          className="flex items-center justify-center gap-2.5 rounded-full border border-hairline px-3 py-1.5 text-sm whitespace-nowrap hover:border-secondary lg:px-4 lg:py-2"
        >
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-signal" />
          <span className="hidden sm:inline">Tell me something</span>
        </button>
        <div ref={menuRef} className="relative lg:ml-2">
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-xs text-secondary hover:text-ink"
          >
            {initials}
          </button>
          {menu && (
            <div className="absolute bottom-full right-0 z-40 mb-2 w-44 rounded-btn border border-hairline bg-ground py-1 lg:bottom-auto lg:left-0 lg:right-auto lg:top-full lg:mt-2 lg:mb-0" role="menu">
              <Link href="/settings" role="menuitem" className="block px-3 py-2 text-sm text-secondary hover:text-ink" onClick={() => setMenu(false)}>
                Settings
              </Link>
              <Link href="/settings/linkedin" role="menuitem" className="block px-3 py-2 text-sm text-secondary hover:text-ink" onClick={() => setMenu(false)}>
                LinkedIn
              </Link>
              <button type="button" role="menuitem" className="block w-full px-3 py-2 text-left text-sm text-secondary hover:text-ink" onClick={() => setMenu(false)}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
