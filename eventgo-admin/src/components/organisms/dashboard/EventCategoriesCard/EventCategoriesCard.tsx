
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Category {
  name: string;
  value: number;
  color: string;
}

export function EventCategoriesCard({
  data,
  totalEvents,
}: {
  data: Category[];
  totalEvents: number;
}) {
  return (
    <Card className="h-full rounded-2xl border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg text-[#08111D]">
          Event Categories
        </CardTitle>
        <p className="text-sm text-slate-500">
          Distribution of events by category
        </p>
      </CardHeader>

      <CardContent>
        <div className="relative h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-2xl text-[#08111D]">
              {totalEvents.toLocaleString("de-DE")}
            </strong>
            <span className="text-xs text-slate-500">Events</span>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="font-semibold text-[#08111D]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
