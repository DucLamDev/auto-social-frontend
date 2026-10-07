"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { Toaster } from "sonner";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: (count, error) => {
      const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 0;
      return !(status >= 400 && status < 500) && count < 2;
    } }, mutations: { retry: false },
  } }));
  return <QueryClientProvider client={queryClient}>{children}<Toaster richColors closeButton position="top-right" /></QueryClientProvider>;
}
