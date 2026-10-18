
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PopularEvent {
  id: string;
  title: string;
  ticketsSold: number;
}

interface PopularEventsChartProps {
  data: PopularEvent[];
}

export function PopularEventsChart({
  data,
}: PopularEventsChartProps) {
  return (
    <section className="analytics-chart-card flex min-h-0 min-w-0 flex-col rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="shrink-0">
        <h2 className="text-xl font-bold text-[#08111D]">
          Most Popular Events
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Top 10 events by demo tickets sold.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[340px] items-center justify-center text-sm text-slate-400">
          No ticket sales data available yet.
        </div>
      ) : (
        <div
          data-chart-area
          className="mt-8 h-[340px] min-h-0 min-w-0 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 10,
                right: 35,
                bottom: 10,
                left: 20,
              }}
            >
              <CartesianGrid
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                horizontal={false}
              />

              <XAxis
                type="number"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                dataKey="title"
                type="category"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#64748B",
                  fontSize: 12,
                }}
                tickFormatter={(value: string) =>
                  value.length > 22
                    ? `${value.slice(0, 22)}…`
                    : value
                }
              />

              <Tooltip />

              <Bar
                dataKey="ticketsSold"
                name="Tickets Sold"
                fill="#FF6B53"
                radius={[0, 8, 8, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
