"use client";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Menu, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { useAccountHealth } from "@/hooks/use-resources";
import { initials } from "@/lib/utils";
import { toast } from "sonner";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { data: user } = useCurrentUser(); const { data: health } = useAccountHealth(); const attention = health?.total ?? 0; const logout = useLogout(); const router = useRouter(); const [menu, setMenu] = useState(false); const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const focusSearch = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener("keydown", focusSearch); return () => window.removeEventListener("keydown", focusSearch); }, []);
  const doLogout = async () => { try { await logout.mutateAsync(); router.replace("/login"); } catch { toast.error("Không thể đăng xuất. Vui lòng thử lại."); } };
  return <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur-xl sm:px-6">
    <button className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onMenu} aria-label="Mở menu"><Menu className="size-5" /></button>
    <form action="/contents" className="relative hidden max-w-md flex-1 md:block"><Search className="absolute left-3.5 top-3 size-4 text-slate-400" /><input ref={searchRef} name="search" aria-label="Tìm nội dung" className="h-10 w-full rounded-xl border border-transparent bg-slate-100/80 pl-10 pr-16 text-sm outline-none transition focus:border-border focus:bg-white focus:ring-4 focus:ring-primary/10" placeholder="Tìm nội dung…" /><kbd className="pointer-events-none absolute right-3 top-2.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘ K</kbd></form>
    <div className="ml-auto flex items-center gap-1.5 sm:gap-3"><Link href="/campaigns" className="hidden h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:bg-primary-hover sm:flex"><Plus className="size-4" />Chiến dịch mới</Link><Link href="/dashboard#can-xu-ly" className="relative grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label={attention ? `${attention} việc cần xử lý` : "Không có việc cần xử lý"} title={attention ? `${attention} việc cần xử lý` : "Không có việc cần xử lý"}><Bell className="size-[18px]" />{attention > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">{attention > 99 ? "99+" : attention}</span>}</Link><div className="mx-1 hidden h-7 w-px bg-border sm:block" />
      <div className="relative"><button onClick={() => setMenu((value) => !value)} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100" aria-expanded={menu}><span className="grid size-8 place-items-center rounded-lg bg-indigo-100 text-xs font-bold text-primary">{initials(user?.name)}</span><span className="hidden text-left xl:block"><span className="block max-w-32 truncate text-xs font-bold">{user?.name}</span><span className="block text-[10px] text-muted">{user?.role}</span></span><ChevronDown className="hidden size-3.5 text-slate-400 sm:block" /></button>{menu && <div className="absolute right-0 top-12 w-52 rounded-xl border border-border bg-white p-1.5 shadow-xl"><div className="border-b border-border px-3 py-2.5 xl:hidden"><p className="truncate text-sm font-semibold">{user?.name}</p><p className="truncate text-xs text-muted">{user?.email}</p></div><button onClick={doLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-red-50 hover:text-danger"><LogOut className="size-4" />Đăng xuất</button></div>}</div>
    </div>
  </header>;
}
