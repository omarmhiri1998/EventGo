"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const UserIdContext = createContext<string | null>(null);

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
      },
    },
  });
}

let browserCache:
  | {
      userId: string;
      client: QueryClient;
    }
  | undefined;

function getQueryClient(userId: string) {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  if (!browserCache || browserCache.userId !== userId) {
    browserCache?.client.clear();

    browserCache = {
      userId,
      client: makeQueryClient(),
    };
  }

  return browserCache.client;
}

export function useCurrentUserId() {
  const userId = useContext(UserIdContext);

  if (userId === null) {
    throw new Error(
      "useCurrentUserId must be used inside Providers"
    );
  }

  return userId;
}

interface ProvidersProps {
  children: ReactNode;
  userId: string;
}

export default function Providers({
  children,
  userId,
}: ProvidersProps) {
  return (
    <UserIdContext.Provider value={userId}>
      <QueryClientProvider client={getQueryClient(userId)}>
        {children}
      </QueryClientProvider>
    </UserIdContext.Provider>
  );
}