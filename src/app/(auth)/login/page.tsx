import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";
export const metadata: Metadata = { title: "Đăng nhập" };
export default function LoginPage() {
  return <div className="grid min-h-screen min-w-0 grid-cols-1 lg:grid-cols-[1.08fr_.92fr]">
    <section className="relative hidden overflow-hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -left-24 top-1/3 size-80 rounded-full bg-violet-500/20 blur-3xl" /><div className="absolute -right-24 top-0 size-96 rounded-full bg-sky-400/15 blur-3xl" />
      <div className="relative flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white font-black text-primary">S</span><span className="text-sm font-bold tracking-[.18em]">SOCIAL PUBLISHER</span></div>
      <div className="relative max-w-xl"><span className="mb-6 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100">Content operations, one calm workspace</span><h1 className="text-balance text-5xl font-bold leading-[1.08] tracking-tight">Từ một ý tưởng đến mọi nền tảng.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Tạo nội dung phù hợp từng kênh, điều phối hàng trăm tài khoản và theo dõi mọi lượt đăng trong một luồng làm việc rõ ràng.</p></div>
      <p className="relative text-xs text-slate-500">Official APIs first · Secure credentials · Observable publishing</p>
    </section>
    <section className="flex min-w-0 items-center justify-center bg-white px-6 py-12"><div className="min-w-0 w-full max-w-md animate-enter"><div className="mb-9 lg:hidden"><span className="grid size-11 place-items-center rounded-xl bg-primary font-black text-white">S</span></div><p className="mb-2 text-sm font-bold text-primary">Chào mừng trở lại</p><h2 className="text-3xl font-bold tracking-tight">Đăng nhập vào workspace</h2><p className="mt-2 text-sm leading-6 text-muted">Quản lý nội dung và lịch xuất bản của đội ngũ.</p><LoginForm /><p className="mt-8 text-center text-xs leading-5 text-slate-400">Thông tin đăng nhập được gửi trực tiếp tới API của bạn qua kết nối bảo mật.</p></div></section>
  </div>;
}
