"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, ArrowRight } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="relative z-50 w-full border-y border-amber-200 bg-white">
      <div className="mx-auto flex h-[76px] w-[92%] -translate-y-2 items-center justify-between gap-3 sm:h-[96px] sm:w-[90%] sm:gap-5">
        <div className="flex min-w-0 shrink-0 items-center">
          <Logo size="lg" />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <label className="relative hidden w-[25vw] min-w-[250px] max-w-[380px] lg:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#4B6B5E]" />
            <input
              type="search"
              aria-label="Search CAMPUS-NEXUS"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-full border border-[#CDEBDD] bg-white py-3 pl-12 pr-4 text-sm text-[#0B2E22] shadow-sm placeholder-[#7A968A] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/30"
            />
          </label>
          <button aria-label="Notifications" className="relative hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#CDEBDD] bg-[#F0FAF5] text-[#047857] shadow-sm sm:flex">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">3</span>
          </button>
          <ThemeToggle />
          {pathname !== "/login" && (
            <Link href="/login" className="flex shrink-0 items-center gap-2 rounded-xl bg-[#FACC15] px-4 py-3 text-sm font-bold text-[#0B2E22] shadow-sm transition-colors hover:bg-[#EAB308] sm:px-6">
              <span className="hidden sm:inline">Login</span><ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

    </header>
  );
}
