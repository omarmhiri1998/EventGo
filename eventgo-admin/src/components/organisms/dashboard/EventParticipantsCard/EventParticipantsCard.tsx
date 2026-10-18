
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ParticipantEvent {
  rank: number;
  title: string;
  location: string;
  count: number;
}

export function EventParticipantsCard({
  items,
}: {
  items: ParticipantEvent[];
}) {
  return (
    <Card className="h-full rounded-2xl border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-[#08111D]">
          <Users size={20} className="text-[#FF6B53]" />
          Event Participants
        </CardTitle>
        <p className="text-sm text-slate-500">
          Tickets registered for each event
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.rank}
            className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 font-bold text-orange-500">
              {item.rank}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[#08111D]">
                {item.title}
              </p>
              <p className="text-xs text-slate-500">
                {item.location}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-[#08111D]">
                {item.count.toLocaleString("de-DE")}
              </p>
              <p className="text-xs text-slate-500">tickets</p>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No participants yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
