"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Toolbar } from "@/components/ui/toolbar";
import { apiGuides } from "./api-guides";

export function ApiGuideView() {
  const [search, setSearch] = useState("");
  const entries = apiGuides.filter(guide => `${guide.name} ${guide.method}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi")));
  return <>
    <PageHeader eyebrow="Thiết lập kết nối" title="Hướng dẫn API" description="Cách lấy khóa, cấp quyền và điền cấu hình cho các connector API đang có trong dự án." action={<Link href="/accounts" className={buttonVariants({ variant: "secondary" })}>Mở Tài khoản</Link>} />
    <Card className="mb-5 space-y-3 p-5 text-sm leading-6">
      <h2 className="flex items-center gap-2 font-bold"><KeyRound className="size-5 text-primary" />Cấu hình một lần cho từng tài khoản</h2>
      <p>Vào <strong>Tài khoản → Kết nối / cấu hình</strong>, chọn nền tảng rồi nhập credential hoặc kết nối OAuth theo hướng dẫn bên dưới. Bấm <strong>Lưu & kiểm tra</strong>, bật đăng bài và chọn tài khoản trong chiến dịch.</p>
      <p>Nếu tài khoản đang dùng Tiện ích Chrome, mở cấu hình Tiện ích và tắt phương thức đó trước khi chuyển sang API. Một tài khoản chỉ dùng một phương thức đăng cho mỗi lượt.</p>
      <p className="text-muted">API công khai vẫn cần quyền đăng của tài khoản. Nút Test kiểm tra kết nối; kết quả xuất bản xem tại Bài đã đăng hoặc Bài chờ duyệt. Các hạn chế ảnh / nội dung ghi dưới đây là phạm vi connector hiện tại của dự án.</p>
    </Card>
    <Card className="overflow-hidden">
      <Toolbar search={search} onSearch={setSearch} searchPlaceholder="Tìm nền tảng, API key, OAuth…" />
      <div className="divide-y divide-border">{entries.map(guide => <details key={guide.id} className="group p-5" open={search.trim() ? true : undefined}>
        <summary className="cursor-pointer text-sm font-bold text-foreground">{guide.name}<span className="ml-3 inline-block rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700">{guide.method}</span></summary>
        <div className="mt-4 space-y-4 text-sm leading-6">
          <p><strong>Điền trên web:</strong> {guide.fields}</p>
          <ol className="list-decimal space-y-2 pl-5">{guide.steps.map(step => <li key={step}>{step}</li>)}</ol>
          {guide.environment && <div className="rounded-xl bg-slate-50 p-4"><p className="mb-2 font-semibold">Dành cho quản trị hệ thống · cấu hình backend</p><pre className="overflow-x-auto whitespace-pre-wrap text-xs">{guide.environment}</pre><p className="mt-3 break-all text-xs">Callback mặc định khi chạy local: <code>http://localhost:3001/api/v1/oauth/{guide.callback}/callback</code></p><p className="mt-2 text-xs text-muted">Khi triển khai, thay phần http://localhost:3001/api/v1/oauth bằng OAUTH_REDIRECT_BASE_URL thực tế. Callback phải khớp chính xác trong trang developer. Các giá trị “...” là chỗ điền, không phải khóa thật; không đặt secret trong biến NEXT_PUBLIC_.</p></div>}
          <p className="rounded-xl bg-amber-50 p-3 text-amber-900">{guide.limits}</p>
          <div className="flex flex-wrap gap-4">{guide.setupUrl && <a href={guide.setupUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Mở trang cấu hình <ExternalLink className="size-3.5" /></a>}<a href={guide.docs} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Tài liệu chính thức <ExternalLink className="size-3.5" /></a></div>
        </div>
      </details>)}</div>
      {!entries.length && <p className="p-6 text-sm text-muted">Chưa có hướng dẫn khớp từ khóa này.</p>}
    </Card>
    <Card className="mt-5 space-y-2 p-5 text-sm leading-6"><h2 className="font-bold">Các nền tảng chưa có connector API đăng bài trong dự án</h2><p>Reddit, Pixelfed, Lemmy, Dailymotion và các mục gắn “Cần API review” cần tích hợp thêm trước khi dùng API để đăng. Medium, Substack, Quora, AWS Community, Tinhte và SlideShare hiện dùng luồng Chrome khi được hỗ trợ; trang này không cung cấp ô API key giả cho các nền tảng đó.</p><p className="text-muted">Kiểm tra lại quyền, hạn mức và quy trình xét duyệt tại tài liệu của từng nền tảng khi cấu hình. Hướng dẫn đối chiếu với connector dự án ngày 30/10/2026.</p></Card>
  </>;
}
