"use client";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpenText, CalendarDays, CheckCheck, Clock3, ChevronLeft, FileText, LayoutDashboard, Megaphone, MessageSquareCode, ScrollText, Settings, Sparkles, UsersRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";
import { AppLogo } from "./app-logo";

const groups = [
  { label: "TỔNG QUAN", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  // Content Studio is the page of one library item, so it has no menu entry; "Thư viện nội dung" stays lit there.
  { label: "NỘI DUNG", items: [{ label: "Nguồn nội dung", href: "/sources", icon: BookOpenText }, { label: "Thư viện nội dung", href: "/contents", icon: FileText, also: ["/studio"] }, { label: "Content đợi duyệt", href: "/ai-content", icon: Sparkles }, { label: "Prompt templates", href: "/prompts", icon: MessageSquareCode }] },
  { label: "PHÂN PHỐI", items: [{ label: "Tài khoản", href: "/accounts", icon: UsersRound }, { label: "Chiến dịch", href: "/campaigns", icon: Megaphone }, { label: "Lịch xuất bản", href: "/calendar", icon: CalendarDays }, { label: "Publishing", href: "/publishing", icon: BarChart3 }, { label: "Bài chờ duyệt", href: "/pending-posts", icon: Clock3 }, { label: "Bài đã đăng", href: "/published-posts", icon: CheckCheck }] },
  { label: "HỆ THỐNG", items: [{ label: "Hướng dẫn API", href: "/api-guide", icon: BookOpenText }, { label: "Nhật ký", href: "/logs", icon: ScrollText }, { label: "Cài đặt", href: "/settings", icon: Settings }] },
] as const;

export function Sidebar({ collapsed, mobileOpen, onCollapse, onMobileClose }: { collapsed: boolean; mobileOpen: boolean; onCollapse: () => void; onMobileClose: () => void }) {
  const pathname = usePathname();
  return <>
    {mobileOpen && <button aria-label="Đóng menu" onClick={onMobileClose} className="fixed inset-0 z-30 bg-[#020617]/45 backdrop-blur-sm lg:hidden" />}
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-white transition-all duration-300", collapsed ? "w-[76px]" : "w-[252px]", mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0")}>
      <div className={cn("flex h-[72px] shrink-0 items-center border-b border-border", collapsed ? "justify-center" : "px-5")}>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3 rounded-xl" onClick={onMobileClose}>
          <AppLogo className="size-9 shadow-sm ring-1 ring-border" label={collapsed ? env.appName : undefined} />
          {!collapsed && <div className="min-w-0"><p className="max-w-40 truncate text-sm font-bold text-foreground">{env.appName}</p><p className="mt-0.5 text-[10px] font-semibold tracking-[.14em] text-slate-400">CONTENT OPERATIONS</p></div>}
        </Link>
        <button type="button" aria-label="Đóng menu" onClick={onMobileClose} className="ml-auto grid size-10 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-foreground lg:hidden"><X className="size-5" /></button>
      </div>
      <nav aria-label="Menu chính" className="flex-1 overflow-y-auto px-3 py-4">{groups.map((group, index) => <div className="mb-4 last:mb-0" key={group.label}>
        {collapsed ? index > 0 && <div className="mx-auto mb-3 h-px w-8 bg-border" aria-hidden /> : <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[.14em] text-slate-400">{group.label}</p>}
        <div className="space-y-0.5">{group.items.map((item) => {
          const active = [item.href, ...("also" in item ? item.also : [])].some((href) => pathname === href || pathname.startsWith(`${href}/`));
          const Icon = item.icon;
          return <Link title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} onClick={onMobileClose} href={item.href as Route} key={item.href}
            className={cn("group relative flex h-11 items-center gap-3 rounded-xl px-2 text-[13px] font-medium transition-colors", active ? "bg-primary-soft font-semibold text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-foreground", collapsed && "justify-center px-0")}>
            {active && <span aria-hidden className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg transition-colors", active ? "bg-primary text-white shadow-sm shadow-primary/30" : "text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm")}><Icon className="size-[17px]" /></span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>;
        })}</div>
      </div>)}</nav>
      <div className="border-t border-border p-3"><button type="button" onClick={onCollapse} aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"} className={cn("hidden h-10 w-full items-center rounded-xl text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-foreground lg:flex", collapsed ? "justify-center" : "gap-3 px-3")}><ChevronLeft className={cn("size-4 transition", collapsed && "rotate-180")} />{!collapsed && "Thu gọn menu"}</button></div>
    </aside>
  </>;
}
