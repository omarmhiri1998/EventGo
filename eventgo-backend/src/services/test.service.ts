
import { pool } from "../db/database";
import { getRandomEvents } from "./event.service";

async function test() {
  try {
    const categories = [
      "nightlife",
      "festivals",
    ] as const;

    for (const category of categories) {
      const events = await getRandomEvents(
        12,
        category
      );

      console.log(`Category: ${category}`);
      console.log(`Number of events: ${events.length}`);

      console.table(
        events.map((event) => ({
          title: event.title,
          category: event.category,
          city: event.city_name,
        }))
      );
    }
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await pool.end();
  }
}

test();
