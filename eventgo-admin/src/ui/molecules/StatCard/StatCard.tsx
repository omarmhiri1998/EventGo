
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: number;
  description?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  description,
}: StatCardProps) {
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FFF0EC] text-[#FF6B53]">
          <Icon size={23} strokeWidth={1.8} />
        </div>

        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              change >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {change >= 0 ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[#08111D]">
          {value}
        </h3>

        {description && (
          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
