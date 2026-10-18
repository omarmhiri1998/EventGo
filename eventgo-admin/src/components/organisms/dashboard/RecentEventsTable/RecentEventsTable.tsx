
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentEvent {
  id: string;
  title: string;
  city: string;
  category: string;
  date: string;
  tickets: string;
  status: string;
}

export function RecentEventsTable({
  items,
}: {
  items: RecentEvent[];
}) {
  return (
    <Card className="h-full rounded-2xl border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-[#08111D]">
          <CalendarDays size={20} className="text-[#FF6B53]" />
          Recent Events
        </CardTitle>
        <p className="text-sm text-slate-500">
          Latest events on the platform
        </p>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-[#F5F7FA] text-slate-500">
              <tr>
                <th className="p-3">Event</th>
                <th className="p-3">City</th>
                <th className="p-3">Category</th>
                <th className="p-3">Date</th>
                <th className="p-3">Tickets</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {items.map((event) => (
                <tr key={event.id} className="text-[#08111D]">
                  <td className="p-3 font-semibold">{event.title}</td>
                  <td className="p-3">{event.city}</td>
                  <td className="p-3">{event.category}</td>
                  <td className="p-3">{event.date}</td>
                  <td className="p-3">{event.tickets}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
