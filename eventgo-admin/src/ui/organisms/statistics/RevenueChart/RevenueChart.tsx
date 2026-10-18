
"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface RevenueData {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <section className="analytics-chart-card flex min-h-0 min-w-0 flex-col rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="shrink-0">
        <h2 className="text-xl font-bold text-[#08111D]">
          Revenue Overview
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Revenue generated from demo ticket sales.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
          No revenue data available yet.
        </div>
      ) : (
        <div
          data-chart-area
          className="mt-8 h-[320px] min-h-0 min-w-0 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 20,
                right: 25,
                left: 0,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#FF6B53"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="#FF6B53"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />

              <Tooltip
                formatter={(value) => [
                  new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  }).format(Number(value ?? 0)),
                  "Demo Revenue",
                ]}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#FF6B53"
                strokeWidth={3}
                fill="url(#revenueGradient)"
                dot={{ r: 4, fill: "#FF6B53" }}
                activeDot={{ r: 7 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
