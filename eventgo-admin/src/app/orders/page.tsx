
import { Suspense } from "react";
import Link from "next/link";

import {
  ShoppingBag,
  CheckCircle2,
  Clock3,
  Wallet,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getAdminOrdersAction } from "../actions/orders.actions";

type SearchParams = {
  page?: string;
  q?: string;
  status?: string;
};

interface OrdersPageProps {
  searchParams: Promise<SearchParams>;
}

const moneyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(date));
}

function statusStyle(status: string) {
  switch (status) {
    case "PAID":
      return "bg-green-50 text-green-700";
    case "DEMO_PAID":
      return "bg-orange-50 text-orange-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "CANCELLED":
    case "FAILED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function pageUrl(
  page: number,
  search: string,
  status: string
) {
  const params = new URLSearchParams();

  if (search) params.set("q", search);
  if (status) params.set("status", status);
  params.set("page", String(page));

  return `/orders?${params.toString()}`;
}

async function OrdersContent({
  searchParams,
}: OrdersPageProps) {
  const params = await searchParams;

  const requestedPage = Number(params.page ?? "1");
  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const search = (params.q ?? "").slice(0, 200);
  const allowedStatuses = [
    "",
    "PAID",
    "DEMO_PAID",
    "PENDING",
    "CANCELLED",
    "FAILED",
  ];

  const status = allowedStatuses.includes(params.status ?? "")
    ? (params.status ?? "")
    : "";

  const result = await getAdminOrdersAction(
    page,
    search,
    status
  );

  const cards = [
    {
      title: "Total Orders",
      value: result.stats.totalOrders.toLocaleString("de-DE"),
      icon: ShoppingBag,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Paid Orders",
      value: result.stats.paidOrders.toLocaleString("de-DE"),
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Pending Orders",
      value: result.stats.pendingOrders.toLocaleString("de-DE"),
      icon: Clock3,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Revenue (EUR)",
      value: moneyFormatter.format(result.stats.revenueEUR),
      icon: Wallet,
      iconBg: "bg-[#FFF0EC]",
      iconColor: "text-[#FF6B53]",
    },
  ];

  const firstItem =
    result.total === 0
      ? 0
      : (page - 1) * result.pageSize + 1;

  const lastItem = Math.min(
    page * result.pageSize,
    result.total
  );

  return (
    <div className="space-y-7 2xl:space-y-9">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight 2xl:text-4xl">
          Orders
        </h1>

        <p className="mt-2 text-sm text-slate-500 2xl:text-base">
          Manage customer purchases and ticket orders.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-7">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.title}
              className="rounded-2xl border-slate-200 bg-white shadow-sm"
            >
              <CardContent className="flex items-center gap-4 p-5 2xl:p-7">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${card.iconBg}`}
                >
                  <Icon className={`h-7 w-7 ${card.iconColor}`} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-1 break-words text-2xl font-extrabold 2xl:text-3xl">
                    {card.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold">
            All Orders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {result.total} matching orders
          </p>

          <form
            action="/orders"
            method="GET"
            className="mt-6 flex flex-wrap gap-3"
          >
            <div className="relative min-w-[250px] flex-[2]">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <Input
                name="q"
                type="search"
                maxLength={200}
                defaultValue={search}
                placeholder="Search order ID, customer or email..."
                className="h-11 border-slate-200 bg-white pl-11 text-[#08111D]"
              />
            </div>

            <select
              name="status"
              defaultValue={status}
              aria-label="Filter by status"
              className="h-11 min-w-[185px] rounded-lg border border-slate-200 bg-white px-4 text-sm text-[#08111D]"
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="DEMO_PAID">Demo Paid</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="FAILED">Failed</option>
            </select>

            <Button
              type="submit"
              className="h-11 bg-[#FF6B53] px-6 text-white hover:bg-[#F15D45]"
            >
              Search
            </Button>

            <Button
              variant="outline"
              className="h-11"
              render={<Link href="/orders" />}
            >
              Reset
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm 2xl:text-base">
            <thead className="bg-[#F5F7FA] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Tickets</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {result.orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition hover:bg-[#F8FAFC]"
                >
                  <td className="px-6 py-4">
                    <span
                      title={order.id}
                      className="font-mono text-xs font-semibold text-[#08111D]"
                    >
                      {order.id.slice(0, 8)}…
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#08111D]">
                      {order.customerName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {order.customerEmail}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    {order.ticketCount}
                  </td>

                  <td className="px-6 py-4 font-semibold">
                    {formatMoney(
                      order.totalAmount,
                      order.currency
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}

              {result.orders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 p-6">
          <p className="text-sm text-slate-500">
            Showing {firstItem}–{lastItem} of {result.total}
          </p>

          <div className="flex items-center gap-3">
            {page > 1 ? (
              <Link
                href={pageUrl(page - 1, search, status)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">
                <ChevronLeft size={16} />
                Previous
              </span>
            )}

            <span className="text-sm font-semibold">
              {page} / {Math.max(result.totalPages, 1)}
            </span>

            {page < result.totalPages ? (
              <Link
                href={pageUrl(page + 1, search, status)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Next
                <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">
                Next
                <ChevronRight size={16} />
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function OrdersLoading() {
  return (
    <div
      role="status"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#FF6B53]" />
        <p className="text-sm text-slate-500">
          Loading orders...
        </p>
      </div>
    </div>
  );
}

export default function OrdersPage(props: OrdersPageProps) {
  return (
    <div className="min-h-full w-full bg-[#F5F7FA] p-5 text-[#08111D] lg:p-8 2xl:p-10">
      <Suspense fallback={<OrdersLoading />}>
        <OrdersContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
