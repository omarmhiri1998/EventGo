
"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CategoryData {
  category: string;
  count: number;
}

interface CategoryChartProps {
  data: CategoryData[];
}

const COLORS = [
  "#FF6B53",
  "#08111D",
  "#F4B860",
  "#3B82F6",
  "#10B981",
  "#A78BFA",
  "#F472B6",
  "#64748B",
  "#06B6D4",
  "#84CC16",
  "#FB923C",
  "#8B5CF6",
];

export function CategoryChart({
  data,
}: CategoryChartProps) {
  return (
    <section className="analytics-chart-card flex min-h-0 min-w-0 flex-col rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="shrink-0">
        <h2 className="text-xl font-bold text-[#08111D]">
          Events by Category
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Distribution of events across categories.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
          No event data available yet.
        </div>
      ) : (
        <div
          data-chart-area
          className="mt-6 h-[340px] min-h-0 min-w-0 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="category"
                innerRadius="45%"
                outerRadius="78%"
                paddingAngle={3}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />

              <Legend
                verticalAlign="bottom"
                wrapperStyle={{
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
