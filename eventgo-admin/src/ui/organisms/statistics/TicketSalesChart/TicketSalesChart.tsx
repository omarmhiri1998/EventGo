
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

interface TicketSalesData {
  date: string;
  tickets: number;
}

interface TicketSalesChartProps {
  data: TicketSalesData[];
}

export function TicketSalesChart({
  data,
}: TicketSalesChartProps) {
  return (
    <section className="analytics-chart-card flex min-h-0 min-w-0 flex-col rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="shrink-0">
        <h2 className="text-xl font-bold text-[#08111D]">
          Ticket Sales
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Tickets sold per day (demo orders).
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
          No ticket sales data available yet.
        </div>
      ) : (
        <div
          data-chart-area
          className="mt-8 h-[320px] min-h-0 min-w-0 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 25,
                left: 0,
                bottom: 10,
              }}
            >
              <CartesianGrid
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />

              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />

              <Tooltip />

              <Bar
                dataKey="tickets"
                name="Tickets Sold"
                fill="#FF6B53"
                radius={[8, 8, 0, 0]}
                maxBarSize={90}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
