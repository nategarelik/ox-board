"use client";

import Link from "next/link";
import { useMemo } from "react";

const NAV_ITEMS = [
  { href: "#mixer", label: "Mixer" },
  { href: "#generator", label: "AI Generator" },
  { href: "#subscriptions", label: "Plans" },
  { href: "#insights", label: "Insights" },
];

export default function AppHeader() {
  const navItems = useMemo(() => NAV_ITEMS, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-black/70 border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-white transition hover:opacity-80"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-rose-500 to-purple-500 font-semibold">
            OX
          </span>
          <div className="flex flex-col">
            <span className="text-sm uppercase tracking-[0.3em] text-white/70">
              Stem Player
            </span>
            <span className="text-lg font-semibold">OX Board</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button className="hidden rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/60 hover:text-white md:block">
            Docs
          </button>
          <button className="rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/40 transition hover:shadow-purple-500/50">
            Launch Studio
          </button>
        </div>
      </div>
    </header>
  );
}
