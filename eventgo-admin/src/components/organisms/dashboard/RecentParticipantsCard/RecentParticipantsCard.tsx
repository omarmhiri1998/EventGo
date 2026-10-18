
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentParticipant {
  id: string;
  name: string;
  email: string;
  eventTitle: string;
  timeAgo: string;
}

export function RecentParticipantsCard({
  items,
}: {
  items: RecentParticipant[];
}) {
  return (
    <Card className="h-full rounded-2xl border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-[#08111D]">
          <Users size={20} className="text-[#FF6B53]" />
          Recent Participants
        </CardTitle>
        <p className="text-sm text-slate-500">
          Latest registrations and ticket purchases
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0EC] font-bold text-[#FF6B53]">
              {participant.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#08111D]">
                {participant.name}
              </p>
              <p className="truncate text-xs text-slate-500">
                {participant.email}
              </p>
              <p className="truncate text-xs text-slate-500">
                {participant.eventTitle}
              </p>
            </div>

            <span className="shrink-0 text-xs text-slate-400">
              {participant.timeAgo}
            </span>
          </div>
        ))}

        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No recent participants.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
