
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: "coral" | "blue" | "purple" | "green";
}

const styles = {
  coral: {
    background: "bg-[#FFF0EC]",
    icon: "text-[#FF6B53]",
  },
  blue: {
    background: "bg-blue-50",
    icon: "text-blue-500",
  },
  purple: {
    background: "bg-purple-50",
    icon: "text-purple-500",
  },
  green: {
    background: "bg-green-50",
    icon: "text-green-600",
  },
};

export function DashboardStatCard({
  label,
  value,
  icon: Icon,
  color,
}: DashboardStatCardProps) {
  const style = styles[color];

  return (
    <Card className="h-full gap-0 rounded-2xl border-slate-200 bg-white py-0 shadow-sm">
      <CardContent className="flex min-h-32 items-center gap-4 p-5 2xl:min-h-40 2xl:p-7">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl 2xl:h-16 2xl:w-16 ${style.background}`}
        >
          <Icon
            className={`h-7 w-7 2xl:h-8 2xl:w-8 ${style.icon}`}
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 2xl:text-base">
            {label}
          </p>

          <p className="mt-1 break-words text-2xl font-extrabold tracking-tight text-[#08111D] 2xl:text-3xl">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
