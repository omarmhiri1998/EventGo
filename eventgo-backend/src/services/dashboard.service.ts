
import { performance } from "node:perf_hooks";
import { pool } from "../db/database";

type SaleRow = {
  ticket_id: string;
  order_id: string;
  user_id: string;
  user_name: string | null;
  email: string;
  total_amount: string;
  currency: string;
  purchased_at: Date | null;
  sale_day: string | null;
  event_id: string;
  event_title: string;
  category: string | null;
  city: string;
  starts_at: Date;
  capacity: number;
  is_demo: boolean;
};

export async function getDashboardData() {
  const totalStart = performance.now();

  console.log("[Dashboard] Starting data load");

  // Step 1: Measure database connection time.
  const connectionStart = performance.now();

  const client = await pool.connect();

  console.log(
    `[Dashboard] DB Connection: ${(
      performance.now() - connectionStart
    ).toFixed(2)} ms`
  );

  let sales: SaleRow[];

  try {
    // Step 2: Measure SQL execution time.
    const queryStart = performance.now();

    const result = await client.query<SaleRow>(`
      SELECT
        t.id AS ticket_id,
        o.id AS order_id,
        o.user_id,
        u.name AS user_name,
        u.email,
        o.total_amount,
        o.currency,
        o.created_at AS purchased_at,
        TO_CHAR(
          o.created_at AT TIME ZONE 'Europe/Berlin',
          'YYYY-MM-DD'
        ) AS sale_day,
        e.id AS event_id,
        e.title AS event_title,
        e.category,
        c.name AS city,
        e.starts_at,
        e.capacity,
        e.is_demo
      FROM orders o
      JOIN tickets t
        ON t.order_id = o.id
      JOIN ticket_types tt
        ON tt.id = t.ticket_type_id
      JOIN events e
        ON e.id = tt.event_id
      JOIN cities c
        ON c.id = e.city_id
      JOIN users u
        ON u.id = o.user_id
      WHERE o.status IN ('PAID', 'DEMO_PAID')
    `);

    console.log(
      `[Dashboard] SQL Query: ${(
        performance.now() - queryStart
      ).toFixed(2)} ms`
    );

    sales = result.rows;

    console.log(
      `[Dashboard] Loaded tickets: ${sales.length}`
    );
  } catch (error) {
    console.error("[Dashboard] Database query failed:", error);
    throw error;
  } finally {
    client.release();
  }

  // Step 3: Measure data processing time.
  const processingStart = performance.now();

  const orders = new Map<string, SaleRow>();
  const events = new Map<string, SaleRow>();
  const customers = new Set<string>();

  const ticketsByEvent = new Map<string, number>();

  const customersByEvent = new Map<
    string,
    Set<string>
  >();

  const categories = new Map<
    string,
    Set<string>
  >();

  const daily = new Map<
    string,
    {
      revenue: number;
      tickets: number;
    }
  >();

  const lastSaleByEvent = new Map<string, number>();

  for (const sale of sales) {
    customers.add(sale.user_id);

    events.set(sale.event_id, sale);

    ticketsByEvent.set(
      sale.event_id,
      (ticketsByEvent.get(sale.event_id) ?? 0) + 1
    );

    if (!customersByEvent.has(sale.event_id)) {
      customersByEvent.set(
        sale.event_id,
        new Set<string>()
      );
    }

    customersByEvent
      .get(sale.event_id)!
      .add(sale.user_id);

    const category =
      sale.category?.trim() || "Other";

    if (!categories.has(category)) {
      categories.set(category, new Set<string>());
    }

    categories.get(category)!.add(sale.event_id);

    const purchasedAt = sale.purchased_at
      ? new Date(sale.purchased_at).getTime()
      : 0;

    lastSaleByEvent.set(
      sale.event_id,
      Math.max(
        lastSaleByEvent.get(sale.event_id) ?? 0,
        purchasedAt
      )
    );

    if (sale.sale_day) {
      const day = daily.get(sale.sale_day) ?? {
        revenue: 0,
        tickets: 0,
      };

      day.tickets += 1;

      daily.set(sale.sale_day, day);
    }

    // Count each order once, even if it contains
    // multiple tickets.
    if (!orders.has(sale.order_id)) {
      orders.set(sale.order_id, sale);

      if (
        sale.sale_day &&
        sale.currency === "EUR"
      ) {
        const day = daily.get(sale.sale_day)!;

        day.revenue += Number(sale.total_amount);
      }
    }
  }

  const totalRevenue = Array.from(
    orders.values()
  )
    .filter((order) => order.currency === "EUR")
    .reduce(
      (sum, order) =>
        sum + Number(order.total_amount),
      0
    );

  const eventEntries = Array.from(events.values());

  const topEvents = eventEntries
    .map((event) => ({
      id: event.event_id,
      title: event.event_title,
      city: event.city,
      ticketsSold:
        ticketsByEvent.get(event.event_id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.ticketsSold - a.ticketsSold
    )
    .slice(0, 5);

  const participantEvents = eventEntries
    .map((event) => ({
      id: event.event_id,
      title: event.event_title,
      city: event.city,
      ticketsSold:
        customersByEvent.get(event.event_id)?.size ?? 0,
    }))
    .sort(
      (a, b) =>
        b.ticketsSold - a.ticketsSold
    )
    .slice(0, 5);

  const recentEvents = [...eventEntries]
    .sort(
      (a, b) =>
        (lastSaleByEvent.get(b.event_id) ?? 0) -
        (lastSaleByEvent.get(a.event_id) ?? 0)
    )
    .slice(0, 8)
    .map((event) => ({
      id: event.event_id,
      title: event.event_title,
      city: event.city,
      category: event.category ?? "Other",
      startsAt: new Date(
        event.starts_at
      ).toISOString(),
      capacity: event.capacity,
      ticketsSold:
        ticketsByEvent.get(event.event_id) ?? 0,
      isDemo: event.is_demo,
    }));

  const recentParticipants = [...sales]
    .sort(
      (a, b) =>
        (a.purchased_at
          ? new Date(b.purchased_at ?? 0).getTime()
          : new Date(b.purchased_at ?? 0).getTime()) -
        (a.purchased_at
          ? new Date(a.purchased_at).getTime()
          : 0)
    )
    .slice(0, 5)
    .map((sale) => ({
      id: sale.ticket_id,
      name: sale.user_name ?? "Unnamed user",
      email: sale.email,
      eventTitle: sale.event_title,
      purchasedAt: sale.purchased_at
        ? new Date(sale.purchased_at).toISOString()
        : null,
    }));

  // Build a 30-day calendar in Europe/Berlin.
  const todayParts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const getPart = (type: string) =>
    todayParts.find(
      (item) => item.type === type
    )?.value ?? "";

  const today = new Date(
    `${getPart("year")}-${getPart("month")}-${getPart("day")}T12:00:00Z`
  );

  const dailyData = Array.from(
    { length: 30 },
    (_, index) => {
      const date = new Date(today);

      date.setUTCDate(
        today.getUTCDate() - (29 - index)
      );

      const key = date.toISOString().slice(0, 10);
      const values = daily.get(key);

      return {
        date: key,
        revenue: values?.revenue ?? 0,
        tickets: values?.tickets ?? 0,
      };
    }
  );

  const dashboardData = {
    metrics: {
      totalRevenue,
      ticketsSold: sales.length,
      totalEvents: events.size,
      totalUsers: customers.size,
    },

    dailyData,

    categories: Array.from(
      categories.entries()
    ).map(([name, eventIds]) => ({
      name,
      value: eventIds.size,
    })),

    topEvents,
    participantEvents,
    recentEvents,
    recentParticipants,
  };

  console.log(
    `[Dashboard] Data Processing: ${(
      performance.now() - processingStart
    ).toFixed(2)} ms`
  );

  console.log(
    `[Dashboard] Total Service Time: ${(
      performance.now() - totalStart
    ).toFixed(2)} ms`
  );

  return dashboardData;
}
