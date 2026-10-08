"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, CheckCircle2, Clock3, Send, Sparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { automationCampaignSchema, type AutomationCampaignInput } from "@/schemas/campaign";
import type { PlatformAccount } from "@/types/domain";

type AutomationCampaignModalProps = {
  open: boolean;
  accounts: PlatformAccount[];
  accountsPending?: boolean;
  accountsError?: unknown;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: AutomationCampaignInput) => Promise<void> | void;
};

const defaultValues: AutomationCampaignInput = {
  name: "",
  brief: "",
  accountIds: [],
  runMode: "NOW",
  scheduledAt: "",
  confirmAutoPublish: false,
};

export function AutomationCampaignModal({
  open,
  accounts,
  accountsPending = false,
  accountsError,
  busy = false,
  onClose,
  onSubmit,
}: AutomationCampaignModalProps) {
  const form = useForm<AutomationCampaignInput>({
    resolver: zodResolver(automationCampaignSchema),
    defaultValues,
  });
  const runMode = useWatch({ control: form.control, name: "runMode" });
  const eligibleAccounts = useMemo(
    () => accounts.filter((account) => account.enabled
      && account.status === "CONNECTED"
      && (account.platform?.mode === "OFFICIAL_API" || account.platform?.mode === "COMPATIBLE_API")),
    [accounts],
  );
  const accountKey = eligibleAccounts.map((account) => account.id).join("|");
  const initializedAccounts = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      initializedAccounts.current = null;
      return;
    }
    if (initializedAccounts.current === null) {
      form.reset({ ...defaultValues, accountIds: eligibleAccounts.map((account) => account.id) });
      initializedAccounts.current = accountKey;
      return;
    }
    // The dialog may open before the accounts request completes. Select the
    // connected accounts once when that first response arrives.
    if (!initializedAccounts.current && accountKey) {
      form.setValue("accountIds", eligibleAccounts.map((account) => account.id));
      initializedAccounts.current = accountKey;
    }
  }, [accountKey, eligibleAccounts, form, open]);

  const submit = form.handleSubmit(onSubmit);
  const safeClose = () => {
    if (!busy) onClose();
  };

  return <Modal
    open={open}
    onClose={safeClose}
    title="Tạo chiến dịch tự động"
    description="Nhập brief một lần, AI sẽ viết nội dung riêng cho từng nền tảng và hệ thống tự đăng."
    className="max-w-3xl"
  >
    <form className="space-y-6" onSubmit={submit}>
      <div className="grid gap-2 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-4 sm:grid-cols-3">
        <FlowStep icon={<Bot className="size-4" />} number="1" label="AI viết bài" />
        <FlowStep icon={<CheckCircle2 className="size-4" />} number="2" label="Tự duyệt biến thể" />
        <FlowStep icon={<Send className="size-4" />} number="3" label="Đăng lên các kênh" />
      </div>

      <div>
        <Label htmlFor="automation-name">Tên chiến dịch</Label>
        <Input
          id="automation-name"
          autoFocus
          placeholder="Ví dụ: Ra mắt dịch vụ VPS tháng 10"
          {...form.register("name")}
        />
        <FieldError>{form.formState.errors.name?.message}</FieldError>
      </div>

      <div>
        <Label htmlFor="automation-brief">Sản phẩm hoặc chiến dịch cần quảng bá</Label>
        <Textarea
          id="automation-brief"
          className="min-h-40"
          placeholder="Mô tả sản phẩm, khách hàng mục tiêu, lợi ích nổi bật, ưu đãi, đường dẫn và giọng văn mong muốn. AI sẽ dùng thông tin này để viết bài phù hợp cho từng kênh."
          {...form.register("brief")}
        />
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <FieldError>{form.formState.errors.brief?.message}</FieldError>
          <span className="ml-auto shrink-0 text-[11px] text-muted">Càng cụ thể, bài viết càng đúng ý</span>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <Label className="mb-0">Đăng tới tài khoản</Label>
            <p className="mt-1 text-xs text-muted">Các tài khoản đã kết nối, đang bật và hỗ trợ tự đăng được chọn sẵn.</p>
          </div>
          {eligibleAccounts.length > 0 && <Controller
            control={form.control}
            name="accountIds"
            render={({ field }) => {
              const allSelected = eligibleAccounts.every((account) => field.value.includes(account.id));
              return <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => field.onChange(allSelected ? [] : eligibleAccounts.map((account) => account.id))}
              >
                {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </Button>;
            }}
          />}
        </div>
        <Controller
          control={form.control}
          name="accountIds"
          render={({ field }) => <div className="grid max-h-60 gap-2 overflow-y-auto rounded-2xl border border-border bg-slate-50/70 p-3 sm:grid-cols-2">
            {accountsPending ? <p className="col-span-2 py-7 text-center text-sm text-muted">Đang tải tài khoản đã kết nối…</p>
              : accountsError ? <p className="col-span-2 py-7 text-center text-sm text-danger">Không thể tải tài khoản. Hãy đóng cửa sổ và thử lại.</p>
                : eligibleAccounts.length ? eligibleAccounts.map((account) => {
                  const checked = field.value.includes(account.id);
                  return <label
                    key={account.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 transition ${checked ? "border-indigo-300 ring-2 ring-indigo-100" : "border-border hover:border-slate-300"}`}
                  >
                    <input
                      type="checkbox"
                      className="size-4 shrink-0 accent-indigo-600"
                      checked={checked}
                      onChange={() => field.onChange(checked
                        ? field.value.filter((id) => id !== account.id)
                        : [...field.value, account.id])}
                    />
                    <PlatformMark slug={account.platform?.slug} name={account.platform?.name ?? "P"} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-foreground">{account.name}</span>
                      <span className="block truncate text-[10px] text-muted">
                        {account.platform?.name ?? "Nền tảng"}{account.username ? ` · @${account.username.replace(/^@/, "")}` : ""}
                      </span>
                    </span>
                  </label>;
                }) : <div className="col-span-2 py-7 text-center">
                  <p className="text-sm font-semibold text-slate-700">Chưa có tài khoản sẵn sàng</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Hãy kết nối và bật ít nhất một tài khoản có API tự đăng. Kênh thủ công hoặc hỗ trợ bằng trình duyệt vẫn dùng được trong chế độ Nâng cao.</p>
                </div>}
          </div>}
        />
        <FieldError>{form.formState.errors.accountIds?.message}</FieldError>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-700">Thời điểm chạy</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${runMode === "NOW" ? "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-100" : "border-border"}`}>
            <input type="radio" value="NOW" className="mt-1 accent-indigo-600" {...form.register("runMode")} />
            <Zap className="mt-0.5 size-4 shrink-0 text-indigo-600" />
            <span><span className="block text-sm font-bold">Chạy ngay</span><span className="mt-0.5 block text-xs leading-5 text-muted">Viết bằng AI và đưa vào hàng đợi đăng ngay.</span></span>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${runMode === "SCHEDULED" ? "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-100" : "border-border"}`}>
            <input type="radio" value="SCHEDULED" className="mt-1 accent-indigo-600" {...form.register("runMode")} />
            <Clock3 className="mt-0.5 size-4 shrink-0 text-indigo-600" />
            <span><span className="block text-sm font-bold">Lên lịch</span><span className="mt-0.5 block text-xs leading-5 text-muted">Chuẩn bị ngay và tự đăng khi đến giờ.</span></span>
          </label>
        </div>
        {runMode === "SCHEDULED" && <div className="mt-3">
          <Label htmlFor="automation-date">Ngày giờ bắt đầu</Label>
          <Input id="automation-date" type="datetime-local" {...form.register("scheduledAt")} />
          <FieldError>{form.formState.errors.scheduledAt?.message}</FieldError>
        </div>}
      </fieldset>

      <div>
        <Controller
          control={form.control}
          name="confirmAutoPublish"
          render={({ field }) => <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${field.value ? "border-amber-300 bg-amber-50" : "border-border bg-slate-50"}`}>
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-amber-600"
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
            />
            <span>
              <span className="block text-sm font-bold text-slate-800">Tôi xác nhận cho phép tự động đăng bài thật</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">Hệ thống sẽ tự duyệt nội dung do AI tạo và gọi API của các tài khoản đã chọn mà không cần duyệt thủ công lần nữa.</span>
            </span>
          </label>}
        />
        <FieldError>{form.formState.errors.confirmAutoPublish?.message}</FieldError>
      </div>

      <div className="flex flex-col-reverse justify-end gap-2 border-t border-border pt-5 sm:flex-row">
        <Button variant="secondary" type="button" disabled={busy} onClick={safeClose}>Hủy</Button>
        <Button type="submit" size="lg" loading={busy}>
          <Sparkles className="size-4" />
          {runMode === "SCHEDULED" ? "Tạo bằng AI & lên lịch" : "Tạo bằng AI & đăng ngay"}
        </Button>
      </div>
    </form>
  </Modal>;
}

function FlowStep({ icon, number, label }: { icon: ReactNode; number: string; label: string }) {
  return <div className="flex items-center gap-2.5 rounded-xl bg-white/75 px-3 py-2.5 text-xs font-semibold text-indigo-950">
    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">{icon}</span>
    <span><span className="mr-1 text-indigo-500">{number}.</span>{label}</span>
  </div>;
}
