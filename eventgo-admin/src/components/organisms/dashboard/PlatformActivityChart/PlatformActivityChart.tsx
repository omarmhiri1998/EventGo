"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Activity } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface PlatformActivityPoint {
  date: string;
  revenue: number;
  tickets: number;
  users?: number;
}

interface PlatformActivityChartProps {
  data: PlatformActivityPoint[];
}

export function PlatformActivityChart({
  data,
}: PlatformActivityChartProps) {
  return (
    <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFE9E3]">
            <Activity className="h-5 w-5 text-[#FF7A59]" />
          </div>

          <div>
            <CardTitle className="text-xl font-bold text-[#08111D]">
              Platform Activity
            </CardTitle>

            <CardDescription className="mt-1 text-sm text-slate-500">
              Revenue, tickets sold and user growth overview
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div data-chart-area className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#E9EEF5" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748B", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748B", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#FF7A59"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="tickets"
                stroke="#4F8EF7"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Tickets"
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#9B5CF6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}