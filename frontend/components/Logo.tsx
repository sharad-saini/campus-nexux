import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Logo({
  showTagline = true,
  size = "md",
}: {
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  light?: boolean;
}) {
  const iconSizes = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-10 w-10 sm:h-14 sm:w-14" };
  const titleSizes = { sm: "text-base", md: "text-lg", lg: "text-xl sm:text-3xl" };

  return (
    <Link
      href="/"
      aria-label="CAMPUS-NEXUS home"
      className="group flex shrink-0 select-none items-center gap-2.5"
    >
      <div className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl border border-[#CDEBDD] bg-[#F0FAF5] p-2 shadow-sm transition-all group-hover:border-[#34D399]`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full text-[#047857] transition-transform group-hover:scale-105">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        <span className="absolute -right-1 -top-1"><Sparkles className="h-3.5 w-3.5 text-[#34D399]" /></span>
      </div>
      <span className="flex flex-col">
        <span className={`${titleSizes[size]} flex items-center gap-1 font-extrabold leading-none tracking-tight text-[#0B2E22]`}>
          CAMPUS<span className="font-black text-[#047857]">-NEXUS</span>
        </span>
        {showTagline && <span className={`${size === "lg" ? "text-[10px] sm:text-base" : "text-[10px]"} mt-1 font-medium uppercase tracking-wider text-[#4B6B5E]`}>Learn · Connect · Thrive</span>}
      </span>
    </Link>
  );
}
