"use client";

import {
  QueryClientProvider as Provider,
  QueryClient,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useSearchParams } from "next/navigation";

const queryClient = new QueryClient();

export function QueryClientProvider({
  children,
  isDevelopmentEnvironment,
}: {
  children: React.ReactNode;
  isDevelopmentEnvironment: boolean;
}) {
  const params = useSearchParams();
  const isDebug = params.get("debug") === "true";
  return (
    <Provider client={queryClient}>
      {children}
      {(isDevelopmentEnvironment || isDebug) && (
        <ReactQueryDevtools buttonPosition="bottom-left" />
      )}
    </Provider>
  );
}
