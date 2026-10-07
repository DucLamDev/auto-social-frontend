"use client";
import { useState, type PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
export function AppShell({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="min-h-screen"><Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCollapse={() => setCollapsed((v) => !v)} onMobileClose={() => setMobileOpen(false)} /><div className={cn("min-h-screen transition-[margin] duration-300", collapsed ? "lg:ml-[76px]" : "lg:ml-[252px]")}><Topbar onMenu={() => setMobileOpen(true)} /><main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main></div></div>;
}
