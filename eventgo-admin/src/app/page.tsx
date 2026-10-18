
import { Suspense } from "react";

import {
  Wallet,
  Ticket,
  CalendarDays,
  Users,
} from "lucide-react";

import { DashboardStatCard } from "@/components/molecules/DashboardStatCard/DashboardStatCard";
import { DashboardCharts } from "@/components/organisms/DashboardCharts/DashboardCharts";
import { PlatformActivityChart } from "@/components/organisms/dashboard/PlatformActivityChart/PlatformActivityChart";
import { EventCategoriesCard } from "@/components/organisms/dashboard/EventCategoriesCard/EventCategoriesCard";
import { TopPerformingEventsCard } from "@/components/organisms/dashboard/TopPerformingEventsCard/TopPerformingEventsCard";
import { EventParticipantsCard } from "@/components/organisms/dashboard/EventParticipantsCard/EventParticipantsCard";
import { RecentEventsTable } from "@/components/organisms/dashboard/RecentEventsTable/RecentEventsTable";
import { RecentParticipantsCard } from "@/components/organisms/dashboard/RecentParticipantsCard/RecentParticipantsCard";

import { getDashboardDataAction } from "./actions/dashboard.actions";

const categoryColors = [
  "#FF6B53",
  "#4F8EF7",
  "#9B5CF6",
  "#33C26B",
  "#F6C453",
  "#A0AEC0",
];

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeZone: "Europe/Berlin",
});

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

const integerFormatter = new Intl.NumberFormat("de-DE");

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

async function DashboardContent() {
  const {
    metrics,
    dailyData,
    categories,
    topEvents: dbTopEvents,
    participantEvents: dbParticipantEvents,
    recentEvents: dbRecentEvents,
    recentParticipants: dbRecentParticipants,
  } = await getDashboardDataAction();

  // Only confirmed sales and bookings, according
  // to the statuses configured in dashboard.service.ts.
  const stats = [
    {
      label: "Total Revenue",
      value: currencyFormatter.format(metrics.totalRevenue),
      icon: Wallet,
      color: "coral" as const,
    },
    {
      label: "Tickets Sold",
      value: integerFormatter.format(metrics.ticketsSold),
      icon: Ticket,
      color: "blue" as const,
    },
    {
      label: "Events with Sales",
      value: integerFormatter.format(metrics.totalEvents),
      icon: CalendarDays,
      color: "purple" as const,
    },
    {
      label: "Customers",
      value: integerFormatter.format(metrics.totalUsers),
      icon: Users,
      color: "green" as const,
    },
  ];

  const categoryData = categories.map((category, index) => ({
    name: category.name,
    value: category.value,
    color: categoryColors[index % categoryColors.length],
  }));

  const topEvents = dbTopEvents.map((event, index) => ({
    rank: index + 1,
    title: event.title,
    location: event.city,
    ticketsSold: event.ticketsSold,
  }));

  // Unique customers per event.
  const participantEvents = dbParticipantEvents.map(
    (event, index) => ({
      rank: index + 1,
      title: event.title,
      location: event.city,
      count: event.ticketsSold,
    })
  );

  const recentEvents = dbRecentEvents.map((event) => ({
    id: event.id,
    title: event.title,
    city: event.city,
    category: event.category,
    date: dateFormatter.format(new Date(event.startsAt)),
    tickets: `${event.ticketsSold} / ${event.capacity}`,
    status: event.isDemo ? "Demo" : "Real",
  }));

  const recentParticipants = dbRecentParticipants.map(
    (participant) => ({
      id: participant.id,
      name: participant.name,
      email: participant.email,
      eventTitle: participant.eventTitle,
      timeAgo: participant.purchasedAt
        ? dateTimeFormatter.format(
            new Date(participant.purchasedAt)
          )
        : "—",
    })
  );

  // Normalize revenue and tickets separately.
  // This is a relative activity comparison, not raw amounts.
  const maxRevenue = Math.max(
    1,
    ...dailyData.map((item) => item.revenue)
  );

  const maxTickets = Math.max(
    1,
    ...dailyData.map((item) => item.tickets)
  );

  const platformActivityData = dailyData.map((item) => ({
    date: item.date.slice(5),
    revenue: Math.round(
      (item.revenue / maxRevenue) * 100
    ),
    tickets: Math.round(
      (item.tickets / maxTickets) * 100
    ),
  }));

  return (
    <div className="w-full space-y-7 2xl:space-y-9">
      {/* DASHBOARD HEADER */}
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#08111D] 2xl:text-4xl">
          Dashboard Overview
        </h1>

        <p className="mt-2 text-sm text-slate-500 2xl:text-base">
          Sales, bookings and participation across your events.
        </p>
      </section>

      {/* METRICS */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-7">
        {stats.map((stat) => (
          <DashboardStatCard
            key={stat.label}
            {...stat}
          />
        ))}
      </section>

      {/* REVENUE AND TICKET SALES */}
      <section className="min-w-0">
        <DashboardCharts data={dailyData} />
      </section>

      {/* FULL WIDTH PLATFORM ACTIVITY */}
      <section className="min-w-0">
        <PlatformActivityChart
          data={platformActivityData}
        />
      </section>

      {/* CATEGORIES AND TOP EVENTS */}
      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        <EventCategoriesCard
          data={categoryData}
          totalEvents={metrics.totalEvents}
        />

        <TopPerformingEventsCard
          items={topEvents}
        />

        <EventParticipantsCard
          items={participantEvents}
        />
      </section>

      {/* RECENT ACTIVITY */}
      <section className="grid grid-cols-1 items-stretch gap-6 2xl:grid-cols-3">
        <div className="min-w-0 2xl:col-span-2">
          <RecentEventsTable items={recentEvents} />
        </div>

        <div className="min-w-0">
          <RecentParticipantsCard
            items={recentParticipants}
          />
        </div>
      </section>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div
      role="status"
      className="flex min-h-[70vh] items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#FF6B53]" />

        <p className="text-sm font-medium text-slate-500">
          Loading dashboard...
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-full w-full bg-[#F5F7FA] p-5 text-[#08111D] lg:p-8 2xl:p-10">
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
