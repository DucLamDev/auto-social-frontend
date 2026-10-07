"use client";
import { useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";
import { useCurrentUser } from "@/hooks/use-auth";
import { ApiError } from "@/services/api/errors";
import { ErrorState, PageLoader } from "@/components/ui/states";

export function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const query = useCurrentUser();
  const unauthorized = query.error instanceof ApiError && query.error.status === 401;
  useEffect(() => { if (unauthorized) router.replace("/login"); }, [router, unauthorized]);
  if (query.isPending || unauthorized) return <PageLoader />;
  if (query.isError) return <div className="grid min-h-screen place-items-center p-6"><ErrorState error={query.error} onRetry={() => void query.refetch()} /></div>;
  return children;
}
