
import Link from "next/link";
import { Ticket } from "lucide-react";

export function AdminBrand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B53] text-white">
        <Ticket size={22} strokeWidth={2.5} />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-xl font-extrabold tracking-tight text-white">
          Event<span className="text-[#FF6B53]">Go</span>
        </span>

        <span className="text-sm font-medium text-slate-400">
          Admin
        </span>
      </div>
    </Link>
  );
}
