
"use client";

import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UserGrowthData {
  date: string;
  users: number;
}

interface UserGrowthChartProps {
  data: UserGrowthData[];
}

export function UserGrowthChart({
  data,
}: UserGrowthChartProps) {
  return (
    <section className="analytics-chart-card flex min-h-0 min-w-0 flex-col rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="shrink-0">
        <h2 className="text-xl font-bold text-[#08111D]">
          User Growth
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Total registered users over time.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
          No user data available yet.
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
                  id="userGrowthGradient"
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

              <Area
                type="monotone"
                dataKey="users"
                name="Total Users"
                stroke="#FF6B53"
                strokeWidth={3}
                fill="url(#userGrowthGradient)"
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
