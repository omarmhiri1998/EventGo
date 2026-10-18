
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PopularEvent {
  rank: number;
  title: string;
  location: string;
  ticketsSold: number;
}

export function TopPerformingEventsCard({
  items,
}: {
  items: PopularEvent[];
}) {
  return (
    <Card className="h-full rounded-2xl border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-[#08111D]">
          <Trophy size={20} className="text-[#FF6B53]" />
          Top Performing Events
        </CardTitle>
        <p className="text-sm text-slate-500">
          Events with the highest ticket sales
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {items.map((event) => (
          <div
            key={event.rank}
            className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF0EC] font-bold text-[#FF6B53]">
              {event.rank}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[#08111D]">
                {event.title}
              </p>
              <p className="text-xs text-slate-500">{event.location}</p>
            </div>

            <strong className="text-sm text-[#08111D]">
              {event.ticketsSold.toLocaleString("de-DE")}
            </strong>
          </div>
        ))}

        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No ticket sales yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
