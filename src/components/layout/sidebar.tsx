"use client";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpenText, CalendarDays, CheckCheck, Clock3, ChevronLeft, FileText, LayoutDashboard, Megaphone, MessageSquareCode, PlugZap, ScrollText, Settings, Sparkles, UsersRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";

const groups = [
  { label: "TỔNG QUAN", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  { label: "NỘI DUNG", items: [{ label: "Nguồn nội dung", href: "/sources", icon: BookOpenText }, { label: "Thư viện nội dung", href: "/contents", icon: FileText }, { label: "Content Studio", href: "/studio", icon: Sparkles }, { label: "Prompt templates", href: "/prompts", icon: MessageSquareCode }] },
  { label: "PHÂN PHỐI", items: [{ label: "Nền tảng", href: "/platforms", icon: PlugZap }, { label: "Tài khoản", href: "/accounts", icon: UsersRound }, { label: "Chiến dịch", href: "/campaigns", icon: Megaphone }, { label: "Lịch xuất bản", href: "/calendar", icon: CalendarDays }, { label: "Publishing", href: "/publishing", icon: BarChart3 }, { label: "Bài chờ duyệt", href: "/pending-posts", icon: Clock3 }, { label: "Bài đã đăng", href: "/published-posts", icon: CheckCheck }] },
  { label: "HỆ THỐNG", items: [{ label: "Hướng dẫn API", href: "/api-guide", icon: BookOpenText }, { label: "Nhật ký", href: "/logs", icon: ScrollText }, { label: "Cài đặt", href: "/settings", icon: Settings }] },
] as const;

export function Sidebar({ collapsed, mobileOpen, onCollapse, onMobileClose }: { collapsed: boolean; mobileOpen: boolean; onCollapse: () => void; onMobileClose: () => void }) {
  const pathname = usePathname();
  return <>
    {mobileOpen && <button aria-label="Đóng menu" onClick={onMobileClose} className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden" />}
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-white transition-all duration-300", collapsed ? "w-[76px]" : "w-[252px]", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
      <div className={cn("flex h-[72px] items-center border-b border-white/[.07]", collapsed ? "justify-center" : "px-5")}><Link href="/dashboard" className="flex items-center gap-3" onClick={onMobileClose}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-sm font-black shadow-lg shadow-indigo-950/50">{env.appName.charAt(0).toUpperCase()}</span>{!collapsed && <div><p className="max-w-40 truncate text-sm font-bold tracking-wide">{env.appName}</p><p className="mt-0.5 text-[10px] text-slate-500">CONTENT OPERATIONS</p></div>}</Link><button onClick={onMobileClose} className="ml-auto text-slate-400 lg:hidden"><X className="size-5" /></button></div>
      <nav className="flex-1 overflow-y-auto px-3 py-5">{groups.map((group) => <div className="mb-5" key={group.label}>{!collapsed && <p className="mb-2 px-3 text-[9px] font-bold tracking-[.16em] text-slate-600">{group.label}</p>}<div className="space-y-1">{group.items.map((item) => { const active = pathname === item.href || pathname.startsWith(`${item.href}/`); const Icon = item.icon; return <Link title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} onClick={onMobileClose} href={item.href as Route} key={item.href} className={cn("group flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition", active ? "bg-white/[.1] text-white shadow-inner" : "text-slate-400 hover:bg-white/[.055] hover:text-slate-100", collapsed && "justify-center px-0")}><Icon className={cn("size-[18px] shrink-0", active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />{!collapsed && <span>{item.label}</span>}{active && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-indigo-400" />}</Link>; })}</div></div>)}</nav>
      <div className="border-t border-white/[.07] p-3"><button onClick={onCollapse} className={cn("hidden h-10 w-full items-center rounded-xl text-xs font-medium text-slate-500 transition hover:bg-white/[.055] hover:text-white lg:flex", collapsed ? "justify-center" : "gap-3 px-3")}><ChevronLeft className={cn("size-4 transition", collapsed && "rotate-180")} />{!collapsed && "Thu gọn menu"}</button></div>
    </aside>
  </>;
}
