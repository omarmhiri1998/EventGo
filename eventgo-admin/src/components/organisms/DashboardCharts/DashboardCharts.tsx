
"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
}from "@/components/ui/card";

import { ChartNoAxesCombined } from "lucide-react";

interface DailyPoint {
  date: string;
  revenue: number;
  tickets: number;
}

interface DashboardChartsProps {
  data: DailyPoint[];
}

function formatDate(date: string) {
  const [, month, day] = date.split("-");

  return `${day}/${month}`;
}

export function DashboardCharts({
  data,
}: DashboardChartsProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatDate(point.date),
  }));

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2 2xl:gap-8">
      {/* REVENUE */}
      <Card className="min-w-0 rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#08111D]">
            <ChartNoAxesCombined
              size={21}
              className="text-[#FF6B53]"
            />
            Revenue Overview
          </CardTitle>

          <p className="text-sm text-slate-500">
            Revenue from paid and demo orders — last 30 days
          </p>
        </CardHeader>

        <CardContent>
          <div className="h-[300px] w-full min-w-0 2xl:h-[400px] min-[3200px]:h-[500px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="dashboardRevenueFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#FF6B53"
                      stopOpacity={0.24}
                    />
                    <stop
                      offset="100%"
                      stopColor="#FF6B53"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#EEF0F3"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={18}
                />

                <YAxis
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                  tickFormatter={(value) => `€${value}`}
                />

                <Tooltip
                  formatter={(value) => [
                    `€${Number(value ?? 0).toFixed(2)}`,
                    "Revenue",
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.date ?? ""
                  }
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF6B53"
                  strokeWidth={3}
                  fill="url(#dashboardRevenueFill)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* TICKETS */}
      <Card className="min-w-0 rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#08111D]">
            <ChartNoAxesCombined
              size={21}
              className="text-[#FF6B53]"
            />
            Ticket Sales
          </CardTitle>

          <p className="text-sm text-slate-500">
            Tickets in paid and demo orders — last 30 days
          </p>
        </CardHeader>

        <CardContent>
          <div className="h-[300px] w-full min-w-0 2xl:h-[400px] min-[3200px]:h-[500px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  stroke="#EEF0F3"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={18}
                />

                <YAxis
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  allowDecimals={false}
                />

                <Tooltip
                  formatter={(value) => [
                    Number(value ?? 0),
                    "Tickets",
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.date ?? ""
                  }
                />

                <Bar
                  dataKey="tickets"
                  fill="#FF6B53"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
