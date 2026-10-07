"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Unhandled UI error", error.digest ?? error.name); }, [error]);
  return <div className="grid min-h-screen place-items-center bg-background p-6"><div className="max-w-md text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-danger"><AlertTriangle className="size-6" /></span><h1 className="mt-5 text-xl font-bold">Giao diện gặp sự cố</h1><p className="mt-2 text-sm leading-6 text-muted">Dữ liệu của bạn không bị thay đổi. Hãy tải lại phần giao diện này hoặc quay lại sau.</p><Button className="mt-6" onClick={reset}><RefreshCw className="size-4" />Thử lại</Button></div></div>;
}
