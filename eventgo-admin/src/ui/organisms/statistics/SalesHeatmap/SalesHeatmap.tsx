
"use client";

import { useMemo } from "react";

interface SalesHeatmapData {
  day: number;
  hour: number;
  orders: number;
}

interface SalesHeatmapProps {
  data: SalesHeatmapData[];
}

const DAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export function SalesHeatmap({
  data,
}: SalesHeatmapProps) {
  const { values, maxOrders } = useMemo(() => {
    const values = new Map<string, number>();

    for (const item of data) {
      values.set(
        `${item.day}-${item.hour}`,
        item.orders
      );
    }

    return {
      values,
      maxOrders: Math.max(
        0,
        ...data.map((item) => item.orders)
      ),
    };
  }, [data]);

  function getCellColor(count: number) {
    if (count === 0 || maxOrders === 0) {
      return "#F1F5F9";
    }

    const intensity = count / maxOrders;

    if (intensity < 0.25) return "#FFE1D9";
    if (intensity < 0.5) return "#FFB6A5";
    if (intensity < 0.75) return "#FF8D76";

    return "#FF6B53";
  }

  return (
    <section className="analytics-chart-card flex min-h-0 min-w-0 flex-col rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="shrink-0">
        <h2 className="text-xl font-bold text-[#08111D]">
          Sales by Day & Hour
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Demo purchase activity by weekday and hour.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
          No sales activity available yet.
        </div>
      ) : (
        <div
          data-chart-area
          className="mt-8 flex h-[340px] min-h-0 w-full flex-col justify-center overflow-x-auto"
        >
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[42px_repeat(24,minmax(0,1fr))] gap-1">
              <div />

              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={`hour-${hour}`}
                  className="pb-2 text-center text-[10px] text-slate-500"
                >
                  {hour % 3 === 0 ? `${hour}:00` : ""}
                </div>
              ))}

              {DAYS.map((dayName, dayIndex) => {
                const day = dayIndex + 1;

                return (
                  <div
                    key={dayName}
                    className="contents"
                  >
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      {dayName}
                    </div>

                    {Array.from(
                      { length: 24 },
                      (_, hour) => {
                        const count =
                          values.get(`${day}-${hour}`) ?? 0;

                        return (
                          <div
                            key={`${day}-${hour}`}
                            title={`${dayName} ${String(hour).padStart(2, "0")}:00 — ${count} orders`}
                            aria-label={`${dayName} at ${hour}:00: ${count} orders`}
                            className="aspect-square min-h-3 rounded-[4px] transition-transform hover:scale-110"
                            style={{
                              backgroundColor: getCellColor(count),
                            }}
                          />
                        );
                      }
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex shrink-0 items-center justify-end gap-2 text-xs text-slate-500">
            <span>Less</span>
            {[
              "#F1F5F9",
              "#FFE1D9",
              "#FFB6A5",
              "#FF8D76",
              "#FF6B53",
            ].map((color) => (
              <span
                key={color}
                className="size-4 rounded"
                style={{ backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      )}
    </section>
  );
}
