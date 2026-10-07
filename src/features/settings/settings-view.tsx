"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Database, Info, LockKeyhole, Save, Settings2, ShieldCheck } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/form";
import { ErrorState, PageLoader } from "@/components/ui/states";
import { useCurrentUser } from "@/hooks/use-auth";
import { useResourceMutation, useSettings } from "@/hooks/use-resources";
import { settingsSchema, type SettingsInput } from "@/schemas/settings";
import { resourcesService } from "@/services/resources.service";
import type { SystemSettings } from "@/types/domain";

function SettingsForm({ settings }: { settings: SystemSettings }) {
  const update = useResourceMutation((input: Partial<SystemSettings>) => resourcesService.updateSettings(input), ["settings"]);
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsInput>,
    defaultValues: {
      model: settings.ai.model || "gpt-5-mini",
      temperature: settings.ai.temperature ?? 0.4,
      storageProvider: settings.storage.provider || "s3",
      bucket: settings.storage.bucket || "",
      timezone: settings.system.timezone || "Asia/Ho_Chi_Minh",
      defaultLocale: settings.system.defaultLocale || "vi",
      pollingInterval: settings.system.pollingInterval ?? 10000,
    },
  });
  const submit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        ai: { ...settings.ai, model: values.model, temperature: values.temperature },
        storage: { ...settings.storage, provider: values.storageProvider, bucket: values.bucket },
        system: { ...settings.system, timezone: values.timezone, defaultLocale: values.defaultLocale, pollingInterval: values.pollingInterval },
      });
      toast.success("Đã lưu metadata quản trị");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể lưu metadata"); }
  });

  return <form onSubmit={submit} className="space-y-5">
    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><Info className="mt-0.5 size-5 shrink-0" /><p><strong>Lưu ý:</strong> các giá trị bên dưới là metadata tham chiếu trong database. Chúng chưa thay đổi cấu hình runtime của API/worker. OpenAI, S3 và polling thực tế tiếp tục lấy từ environment khi build/deploy; muốn áp dụng phải cập nhật env và restart dịch vụ.</p></div>
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border p-5"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-primary"><Bot className="size-5" /></span><div className="mr-auto"><h2 className="font-bold">AI metadata</h2><p className="mt-1 text-xs text-muted">Ghi lại lựa chọn mong muốn; runtime dùng `OPENAI_MODEL` và backend env.</p></div><Badge value="METADATA" /></div>
      <div className="grid gap-5 p-5 sm:grid-cols-2"><div><Label htmlFor="model">Model mong muốn (tham chiếu)</Label><Input id="model" {...form.register("model")} /><FieldError>{form.formState.errors.model?.message}</FieldError></div><div><Label htmlFor="temperature">Temperature mong muốn (0–2)</Label><Input id="temperature" type="number" min="0" max="2" step="0.1" {...form.register("temperature")} /><FieldError>{form.formState.errors.temperature?.message}</FieldError></div></div>
    </Card>
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border p-5"><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-600"><Database className="size-5" /></span><div className="mr-auto"><h2 className="font-bold">Storage metadata</h2><p className="mt-1 text-xs text-muted">Thông tin tham chiếu; endpoint, access key, secret và bucket runtime dùng backend env.</p></div><Badge value="METADATA" /></div>
      <div className="grid gap-5 p-5 sm:grid-cols-2"><div><Label htmlFor="provider">Provider mong muốn</Label><Select id="provider" {...form.register("storageProvider")}><option value="s3">Amazon S3</option><option value="minio">MinIO / S3 compatible</option></Select></div><div><Label htmlFor="bucket">Bucket tham chiếu</Label><Input id="bucket" placeholder="social-publisher" {...form.register("bucket")} /></div></div>
    </Card>
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border p-5"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Settings2 className="size-5" /></span><div><h2 className="font-bold">UI/System metadata</h2><p className="mt-1 text-xs text-muted">Giá trị tham chiếu cho cấu hình tương lai; frontend hiện dùng public env và timezone trình duyệt.</p></div></div>
      <div className="grid gap-5 p-5 sm:grid-cols-3"><div><Label htmlFor="timezone">Timezone mong muốn</Label><Input id="timezone" {...form.register("timezone")} /></div><div><Label htmlFor="locale">Ngôn ngữ mong muốn</Label><Select id="locale" {...form.register("defaultLocale")}><option value="vi">Tiếng Việt</option><option value="en">English</option></Select></div><div><Label htmlFor="polling">Polling mong muốn (ms)</Label><Input id="polling" type="number" step="1000" {...form.register("pollingInterval")} /></div></div>
    </Card>
    <div className="flex justify-end"><Button type="submit" size="lg" loading={update.isPending}><Save className="size-4" />Lưu metadata</Button></div>
  </form>;
}

export function SettingsView() {
  const { data: user } = useCurrentUser();
  if (user?.role !== "ADMIN") return <div className="animate-enter"><PageHeader eyebrow="System" title="Cài đặt" description="Metadata quản trị dùng chung cho hệ thống." /><Card><div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600"><LockKeyhole className="size-6" /></span><h2 className="mt-4 font-bold">Bạn không có quyền truy cập</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">Chỉ vai trò ADMIN có thể xem và thay đổi metadata quản trị.</p></div></Card></div>;
  return <SettingsAdmin />;
}

function SettingsAdmin() {
  const query = useSettings();
  if (query.isPending) return <PageLoader />;
  if (query.isError) return <><PageHeader title="Cài đặt" /><Card><ErrorState error={query.error} onRetry={() => void query.refetch()} /></Card></>;
  return <div className="animate-enter"><PageHeader eyebrow="System" title="Cài đặt" description="Lưu metadata quản trị không chứa secret. Cấu hình runtime vẫn do backend/deployment environment quản lý." action={<span className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><ShieldCheck className="size-4" />Không lưu secret</span>} /><SettingsForm settings={query.data} /></div>;
}
