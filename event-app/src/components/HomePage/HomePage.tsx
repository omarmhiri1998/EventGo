import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getRandomEventsAction } from "@/app/actions/event.actions";
import { HomeContent } from "./HomeContent";

export async function HomePage() {
  const queryClient = new QueryClient();

  await queryClient.fetchQuery({
    queryKey: ["events", "random", "all"],
    queryFn: () => getRandomEventsAction("all"),
    staleTime: 60_000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent />
    </HydrationBoundary>
  );
}