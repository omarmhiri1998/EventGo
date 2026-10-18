import { pool } from "../db/database";

export async function getSalesOverview() {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)
       FROM orders
       WHERE status = 'DEMO_PAID'
         AND currency = 'EUR') AS total_orders,

      (SELECT COALESCE(SUM(total_amount), 0)
       FROM orders
       WHERE status = 'DEMO_PAID'
         AND currency = 'EUR') AS total_revenue,

      (SELECT COUNT(*)
       FROM tickets t
       JOIN orders o ON o.id = t.order_id
       WHERE o.status = 'DEMO_PAID'
         AND o.currency = 'EUR') AS tickets_sold
  `);

  return {
    totalOrders: Number(result.rows[0].total_orders),
    totalRevenue: Number(result.rows[0].total_revenue),
    ticketsSold: Number(result.rows[0].tickets_sold),
  };
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

export async function getDailyRevenue(): Promise<DailyRevenue[]> {
  const result = await pool.query<{
    date: string;
    revenue: string;
  }>(
    `
    SELECT
      TO_CHAR(
        created_at AT TIME ZONE 'Europe/Berlin',
        'YYYY-MM-DD'
      ) AS date,
      COALESCE(SUM(total_amount), 0) AS revenue
    FROM orders
    WHERE status = 'DEMO_PAID'
      AND currency = 'EUR'
      AND created_at IS NOT NULL
    GROUP BY 1
    ORDER BY 1 ASC
    `
  );

  return result.rows.map((row) => ({
    date: row.date,
    revenue: Number(row.revenue),
  }));
}

export interface DailyTicketSales {
  date: string;
  tickets: number;
}

export async function getDailyTicketSales(): Promise<DailyTicketSales[]> {
  const result = await pool.query<{
    date: string;
    tickets: string;
  }>(
    `
    SELECT
      TO_CHAR(
        o.created_at AT TIME ZONE 'Europe/Berlin',
        'YYYY-MM-DD'
      ) AS date,
      COUNT(t.id) AS tickets
    FROM orders o
    JOIN tickets t ON t.order_id = o.id
    WHERE o.status = 'DEMO_PAID'
      AND o.currency = 'EUR'
      AND o.created_at IS NOT NULL
    GROUP BY 1
    ORDER BY 1 ASC
    `
  );

  return result.rows.map((row) => ({
    date: row.date,
    tickets: Number(row.tickets),
  }));
}

export interface EventsByCategory {
  category: string;
  count: number;
}

export async function getEventsByCategory(): Promise<EventsByCategory[]> {
  const result = await pool.query<{
    category: string;
    count: string;
  }>(
    `
    SELECT
      category,
      COUNT(*) AS count
    FROM events
    GROUP BY category
    ORDER BY count DESC
    `
  );

  return result.rows.map((row) => ({
    category: row.category,
    count: Number(row.count),
  }));
}

export interface PopularEvent {
  id: string;
  title: string;
  ticketsSold: number;
}

export async function getMostPopularEvents(): Promise<PopularEvent[]> {
  const result = await pool.query<{
    id: string;
    title: string;
    tickets_sold: string;
  }>(
    `
    SELECT
      e.id,
      e.title,
      COUNT(t.id) AS tickets_sold
    FROM events e
    JOIN ticket_types tt
      ON tt.event_id = e.id
    JOIN tickets t
      ON t.ticket_type_id = tt.id
    JOIN orders o
      ON o.id = t.order_id
    WHERE o.status = 'DEMO_PAID'
      AND o.currency = 'EUR'
    GROUP BY e.id, e.title
    ORDER BY tickets_sold DESC, e.title ASC
    LIMIT 10
    `
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    ticketsSold: Number(row.tickets_sold),
  }));
}

export interface UserGrowthData {
  date: string;
  users: number;
}

export async function getUserGrowth(): Promise<UserGrowthData[]> {
  const result = await pool.query<{
    date: string;
    users: string;
  }>(`
    SELECT
      TO_CHAR(
        created_at AT TIME ZONE 'Europe/Berlin',
        'YYYY-MM-DD'
      ) AS date,
      COUNT(*) AS users
    FROM users
    WHERE created_at IS NOT NULL
    GROUP BY 1
    ORDER BY 1 ASC
  `);

  let cumulative = 0;

  return result.rows.map((row) => {
    cumulative += Number(row.users);

    return {
      date: row.date,
      users: cumulative,
    };
  });
}

export interface SalesHeatmapData {
  day: number;
  hour: number;
  orders: number;
}

export async function getSalesHeatmap(): Promise<SalesHeatmapData[]> {
  const result = await pool.query<{
    day: string;
    hour: string;
    orders: string;
  }>(`
    SELECT
      EXTRACT(
        ISODOW FROM created_at AT TIME ZONE 'Europe/Berlin'
      ) AS day,
      EXTRACT(
        HOUR FROM created_at AT TIME ZONE 'Europe/Berlin'
      ) AS hour,
      COUNT(*) AS orders
    FROM orders
    WHERE status = 'DEMO_PAID'
      AND created_at IS NOT NULL
    GROUP BY 1, 2
    ORDER BY 1, 2
  `);

  return result.rows.map((row) => ({
    day: Number(row.day),
    hour: Number(row.hour),
    orders: Number(row.orders),
  }));
}


