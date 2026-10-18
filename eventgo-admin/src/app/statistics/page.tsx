
import { Suspense } from "react";

import {
  Wallet,
  Ticket,
  CalendarDays,
  Users,
  ChartNoAxesCombined,
} from "lucide-react";

import {
  getSalesOverviewAction,
  getDailyRevenueAction,
  getDailyTicketSalesAction,
  getEventsByCategoryAction,
  getMostPopularEventsAction,
  getUserGrowthAction,
  getSalesHeatmapAction,
} from "../actions/analytics.actions";

import { StatCard } from "@/ui/molecules/StatCard/StatCard";
import { ChartTools } from "@/ui/molecules/ChartTools/ChartTools";

import { RevenueChart } from "@/ui/organisms/statistics/RevenueChart/RevenueChart";
import { TicketSalesChart } from "@/ui/organisms/statistics/TicketSalesChart/TicketSalesChart";
import { CategoryChart } from "@/ui/organisms/statistics/CategoryChart/CategoryChart";
import { PopularEventsChart } from "@/ui/organisms/statistics/PopularEventsChart/PopularEventsChart";
import { UserGrowthChart } from "@/ui/organisms/statistics/UserGrowthChart/UserGrowthChart";
import { SalesHeatmap } from "@/ui/organisms/statistics/SalesHeatmap/SalesHeatmap";

async function StatisticsContent() {
  const [
    sales,
    revenueData,
    ticketSalesData,
    categoryData,
    popularEventsData,
    userGrowthData,
    salesHeatmapData,
  ] = await Promise.all([
    getSalesOverviewAction(),
    getDailyRevenueAction(),
    getDailyTicketSalesAction(),
    getEventsByCategoryAction(),
    getMostPopularEventsAction(),
    getUserGrowthAction(),
    getSalesHeatmapAction(),
  ]);

  const totalEvents = categoryData.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const totalUsers =
    userGrowthData.length > 0
      ? userGrowthData[userGrowthData.length - 1].users
      : 0;

  return (
    <div className="w-full space-y-8 2xl:space-y-10">
      {/* PAGE HEADER */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#FF6B53]">
            <ChartNoAxesCombined size={19} />
            Analytics
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#08111D] 2xl:text-4xl">
            Statistics Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500 2xl:text-base">
            Track revenue, ticket sales and event performance.
          </p>
        </div>
      </section>

      {/* STATISTICS CARDS */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-7">
        <StatCard
          title="Demo Revenue"
          value={`${sales.totalRevenue.toFixed(2)} €`}
          icon={Wallet}
          description="Demo payments only"
        />

        <StatCard
          title="Tickets Sold (Demo)"
          value={String(sales.ticketsSold)}
          icon={Ticket}
          description={`${sales.totalOrders} demo orders`}
        />

        <StatCard
          title="Total Events"
          value={String(totalEvents)}
          icon={CalendarDays}
          description="Events in database"
        />

        <StatCard
          title="Total Users"
          value={String(totalUsers)}
          icon={Users}
          description="Registered users"
        />
      </section>

      {/* ANALYTICS CHARTS */}
      <section className="grid min-w-0 grid-cols-1 items-stretch gap-6 xl:grid-cols-2 2xl:gap-8">
        <div className="min-w-0">
          <ChartTools title="Revenue Overview">
            <RevenueChart data={revenueData} />
          </ChartTools>
        </div>

        <div className="min-w-0">
          <ChartTools title="Ticket Sales">
            <TicketSalesChart data={ticketSalesData} />
          </ChartTools>
        </div>

        <div className="min-w-0">
          <ChartTools title="Events by Category">
            <CategoryChart data={categoryData} />
          </ChartTools>
        </div>

        <div className="min-w-0">
          <ChartTools title="Most Popular Events">
            <PopularEventsChart data={popularEventsData} />
          </ChartTools>
        </div>

        <div className="min-w-0">
          <ChartTools title="User Growth">
            <UserGrowthChart data={userGrowthData} />
          </ChartTools>
        </div>

        <div className="min-w-0">
          <ChartTools title="Sales by Day and Hour">
            <SalesHeatmap data={salesHeatmapData} />
          </ChartTools>
        </div>
      </section>
    </div>
  );
}

function StatisticsLoading() {
  return (
    <div
      role="status"
      className="flex min-h-[65vh] items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#FF6B53]" />

        <p className="text-sm font-medium text-slate-500">
          Loading analytics...
        </p>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  return (
    <div className="min-h-full w-full bg-[#F5F7FA] p-5 text-[#08111D] lg:p-8 2xl:p-10">
      <Suspense fallback={<StatisticsLoading />}>
        <StatisticsContent />
      </Suspense>
    </div>
  );
}
