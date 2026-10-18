
import { getRandomEventsAction } from "@/app/actions/event.actions";
import { HomeContent } from "./HomeContent";

export async function HomePage() {
  const events = await getRandomEventsAction("all");

  return <HomeContent events={events} />;
}
