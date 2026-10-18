
"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminSearch() {
  return (
    <div className="relative w-full max-w-md">
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <Input
        type="search"
        placeholder="Search events, participants, orders..."
        aria-label="Search administration"
        disabled
        className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-[#08111D] placeholder:text-slate-400"
      />
    </div>
  );
}
