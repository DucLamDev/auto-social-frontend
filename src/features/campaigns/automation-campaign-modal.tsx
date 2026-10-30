"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Bot, CheckCircle2, Clock3, ImagePlus, Send, Sparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { automationCampaignSchema, type AutomationCampaignInput } from "@/schemas/campaign";
import type { AiProviderOption, PlatformAccount } from "@/types/domain";
import { canAddAutomationAccount, countAutomationPlatforms, defaultAutomationAccountIds, getAutomationAccountBlocker, isAutomationAccountEligible, MAX_AUTOMATION_PLATFORMS } from "./campaign-utils";

type AutomationCampaignModalProps = {
  open: boolean;
  accounts: PlatformAccount[];
  accountsPending?: boolean;
  accountsError?: unknown;
  aiProviders: AiProviderOption[];
  aiProvidersPending?: boolean;
  aiProvidersError?: unknown;
  submitError?: string | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: AutomationCampaignInput) => Promise<void> | void;
};

const defaultValues: AutomationCampaignInput = {
  name: "",
  brief: "",
  imageAltText: "",
  accountIds: [],
  aiProvider: "openai",
  runMode: "NOW",
  scheduledAt: "",
  confirmAutoPublish: true,
};

export function AutomationCampaignModal({
  open,
  accounts,
  accountsPending = false,
  accountsError,
  aiProviders,
  aiProvidersPending = false,
  aiProvidersError,
  submitError,
  busy = false,
  onClose,
  onSubmit,
}: AutomationCampaignModalProps) {
  const form = useForm<AutomationCampaignInput>({
    resolver: zodResolver(automationCampaignSchema),
    defaultValues,
  });
  const runMode = useWatch({ control: form.control, name: "runMode" });
  const selectedAiProvider = useWatch({ control: form.control, name: "aiProvider" });
  const selectedAccountIds = useWatch({ control: form.control, name: "accountIds" });
  const preferredAiProvider = aiProviders.find((provider) => provider.configured && provider.isDefault)
    ?? aiProviders.find((provider) => provider.configured);
  const selectedAiProviderOption = aiProviders.find((provider) => provider.id === selectedAiProvider);
  const eligibleAccounts = useMemo(
    () => accounts.filter(isAutomationAccountEligible),
    [accounts],
  );
  const blockedAutomationAccounts = useMemo(
    () => accounts.filter((account) => account.enabled && !isAutomationAccountEligible(account)),
    [accounts],
  );
  const accountKey = eligibleAccounts.map((account) => account.id).join("|");
  const defaultAccountIds = useMemo(() => defaultAutomationAccountIds(eligibleAccounts), [eligibleAccounts]);
  const selectedPlatformCount = countAutomationPlatforms(eligibleAccounts, selectedAccountIds);
  const initializedAccounts = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      initializedAccounts.current = null;
      return;
    }
    if (initializedAccounts.current === null) {
      form.reset({
        ...defaultValues,
        accountIds: defaultAccountIds,
        aiProvider: preferredAiProvider?.id ?? defaultValues.aiProvider,
      });
      initializedAccounts.current = accountKey;
      return;
    }
    // The dialog may open before the accounts request completes. Select the
    // connected accounts once when that first response arrives.
    if (!initializedAccounts.current && accountKey) {
      form.setValue("accountIds", defaultAccountIds);
      initializedAccounts.current = accountKey;
    }
    const currentProvider = aiProviders.find((provider) => provider.id === form.getValues("aiProvider"));
    if (!currentProvider?.configured && preferredAiProvider) {
      form.setValue("aiProvider", preferredAiProvider.id);
    }
  }, [accountKey, aiProviders, defaultAccountIds, form, open, preferredAiProvider]);

  const submit = form.handleSubmit(async (values) => {
    if (accounts.some(account => values.accountIds.includes(account.id) && account.settings?.extensionEngine === "pixelfed") && (!values.image || values.image.size > 20 * 1024 * 1024)) {
      form.setError("image", { type: "manual", message: "Pixelfed cần ảnh đính kèm tối đa 20 MiB. Thêm ảnh để đăng cùng các nền tảng đã chọn." });
      return;
    }
    const provider = aiProviders.find((item) => item.id === values.aiProvider);
    if (!provider?.configured) {
      form.setError("aiProvider", {
        type: "manual",
        message: "Chọn một provider đã được cấu hình trong backend.",
      });
      return;
    }
    if (countAutomationPlatforms(eligibleAccounts, values.accountIds) > MAX_AUTOMATION_PLATFORMS) {
      form.setError("accountIds", {
        type: "manual",
        message: `Mỗi lần chỉ được chọn tối đa ${MAX_AUTOMATION_PLATFORMS} nền tảng khác nhau.`,
      });
      return;
    }
    await onSubmit(values);
  });
  const safeClose = () => {
    if (!busy) onClose();
  };

  return <Modal
    open={open}
    onClose={safeClose}
    title="Tạo bài & đăng tự động"
    description="Nhập mô tả, chọn tài khoản rồi bấm Tạo bằng AI & đăng ngay. Hệ thống tự viết nội dung phù hợp từng nền tảng và đăng qua các kết nối đã thiết lập."
    className="max-w-3xl"
  >
    <form className="space-y-6" onSubmit={submit}>
      <div className="grid gap-2 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-4 sm:grid-cols-3">
        <FlowStep icon={<Bot className="size-4" />} number="1" label="AI viết bài" />
        <FlowStep icon={<CheckCircle2 className="size-4" />} number="2" label="Phù hợp từng kênh" />
        <FlowStep icon={<Send className="size-4" />} number="3" label="Đăng lên các kênh" />
      </div>

      <div>
        <Label htmlFor="automation-brief">Mô tả bài đăng</Label>
        <Textarea
          id="automation-brief"
          autoFocus
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
        <Label htmlFor="automation-name">Tên chiến dịch (tuỳ chọn)</Label>
        <Input
          id="automation-name"
          placeholder="Ví dụ: Ra mắt dịch vụ VPS tháng 10"
          {...form.register("name")}
        />
        <FieldError>{form.formState.errors.name?.message}</FieldError>
        <p className="mt-1.5 text-xs text-muted">Để trống để hệ thống tạo tên ngắn gọn từ mô tả.</p>
      </div>

      <div className="rounded-2xl border border-border bg-slate-50/70 p-4">
        <div className="mb-3 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm"><ImagePlus className="size-4" /></span>
          <div>
            <Label htmlFor="automation-image" className="mb-0">Ảnh minh hoạ (tuỳ chọn)</Label>
            <p className="mt-1 text-xs leading-5 text-muted">JPEG, PNG hoặc WebP, tối đa 50 MiB; Pixelfed tối đa 20 MiB. Bắt buộc khi chọn Pixelfed. Ảnh được tải lên một lần và dùng chung cho các biến thể phù hợp.</p>
          </div>
        </div>
        <Controller
          control={form.control}
          name="image"
          render={({ field: { name, onBlur, onChange, ref } }) => <Input
            id="automation-image"
            name={name}
            ref={ref}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="cursor-pointer py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-indigo-700"
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.files?.[0])}
          />}
        />
        <FieldError>{form.formState.errors.image?.message}</FieldError>
        <div className="mt-3">
          <Label htmlFor="automation-image-alt">Mô tả ảnh / alt text (tuỳ chọn)</Label>
          <Input
            id="automation-image-alt"
            placeholder="Ví dụ: Bảng điều khiển VPS hiển thị mức sử dụng CPU"
            {...form.register("imageAltText")}
          />
          <FieldError>{form.formState.errors.imageAltText?.message}</FieldError>
        </div>
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
          Ảnh được gửi tới các kênh hỗ trợ ảnh; các kênh còn lại đăng nội dung văn bản.
        </p>
      </div>

      <div>
        <Label htmlFor="automation-ai-provider">Nhà cung cấp AI</Label>
        <Select
          id="automation-ai-provider"
          disabled={aiProvidersPending || !aiProviders.some((provider) => provider.configured)}
          {...form.register("aiProvider")}
        >
          {aiProviders.length ? aiProviders.map((provider) => <option
            key={provider.id}
            value={provider.id}
            disabled={!provider.configured}
          >
            {provider.label} · {provider.model}{provider.configured ? "" : " (chưa cấu hình)"}
          </option>) : <option value="openai">Đang tải cấu hình AI…</option>}
        </Select>
        <FieldError>{form.formState.errors.aiProvider?.message}</FieldError>
        {aiProvidersError
          ? <p className="mt-1.5 text-xs text-danger">Không thể tải cấu hình AI. Hãy đóng cửa sổ và thử lại.</p>
          : <p className="mt-1.5 text-xs text-muted">
            {selectedAiProviderOption?.configured
              ? "Đã chọn sẵn AI của workspace. Bạn có thể giữ nguyên để đăng ngay."
              : "AI này chưa được cấu hình cho workspace."}
          </p>}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <Label className="mb-0">Đăng tới tài khoản</Label>
            <p className="mt-1 text-xs text-muted">Các tài khoản đã kết nối và bật đăng tự động được chọn sẵn. Bạn có thể bỏ những kênh không muốn đăng.</p>
            <p className="mt-1 text-[11px] font-semibold text-indigo-700">Đã chọn {selectedPlatformCount}/{MAX_AUTOMATION_PLATFORMS} nền tảng; có thể chọn nhiều tài khoản cùng nền tảng.</p>
          </div>
          {eligibleAccounts.length > 0 && <Controller
            control={form.control}
            name="accountIds"
            render={({ field }) => {
              const defaultSelectionActive = field.value.length === defaultAccountIds.length
                && defaultAccountIds.every((id) => field.value.includes(id));
              return <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  form.clearErrors("accountIds");
                  field.onChange(defaultSelectionActive ? [] : defaultAccountIds);
                }}
              >
                {defaultSelectionActive ? "Bỏ chọn tất cả" : eligibleAccounts.length === defaultAccountIds.length ? "Chọn tất cả" : `Chọn tối đa ${MAX_AUTOMATION_PLATFORMS} nền tảng`}
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
                      onChange={() => {
                        form.clearErrors("accountIds");
                        if (checked) {
                          field.onChange(field.value.filter((id) => id !== account.id));
                          return;
                        }
                        if (!canAddAutomationAccount(eligibleAccounts, field.value, account)) {
                          form.setError("accountIds", {
                            type: "manual",
                            message: `Tối đa ${MAX_AUTOMATION_PLATFORMS} nền tảng khác nhau mỗi lần. Bỏ chọn một nền tảng trước khi thêm kênh này.`,
                          });
                          return;
                        }
                        field.onChange([...field.value, account.id]);
                      }}
                    />
                    <PlatformMark slug={account.platform?.slug} name={account.platform?.name ?? "P"} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-foreground">{account.name}</span>
                      <span className="block truncate text-[10px] text-muted">
                        {account.platform?.name ?? "Nền tảng"}{account.username ? ` · @${account.username.replace(/^@/, "")}` : ""}
                        {account.settings?.delivery === "extension"
                          ? " · Tự động qua tiện ích Chrome"
                          : account.platform?.mode === "MANUAL"
                          ? " · Bàn giao thủ công"
                          : account.platform?.mode === "BROWSER_ASSISTED"
                            ? " · Tự động qua Playwright"
                            : " · Tự động qua API"}
                      </span>
                    </span>
                  </label>;
                }) : <div className="col-span-2 py-7 text-center">
                  <p className="text-sm font-semibold text-slate-700">Chưa có tài khoản sẵn sàng</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Hãy kết nối tài khoản API, cấu hình luồng diễn đàn qua tiện ích Chrome hoặc hoàn tất đăng nhập Playwright.</p>
                </div>}
          </div>}
        />
        <FieldError>{form.formState.errors.accountIds?.message}</FieldError>
        {blockedAutomationAccounts.length > 0 && <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Điểm đến chưa thể tự đăng</p>
              <ul className="mt-1.5 max-h-28 space-y-1 overflow-y-auto">
                {blockedAutomationAccounts.map((account) => <li key={account.id}>
                  <span className="font-semibold">{account.name}:</span> {getAutomationAccountBlocker(account)}
                </li>)}
              </ul>
              <a href="/accounts" className="mt-2 inline-flex font-bold text-amber-950 underline underline-offset-2">Mở Tài khoản để hoàn tất kết nối hoặc xem phương thức hỗ trợ</a>
            </div>
          </div>
        </div>}
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

      <p className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-950">Bấm nút bên dưới sẽ tạo nội dung và đăng lên {selectedAccountIds.length} tài khoản đã chọn. Tiến độ và các bài chờ duyệt được cập nhật trên web.</p>

      {submitError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          <p className="font-bold">Chưa thể tạo và đăng chiến dịch</p>
          <p className="mt-1 text-xs">{submitError}</p>
        </div>
      )}

      <div className="sticky -bottom-6 z-10 -mx-6 flex flex-col-reverse justify-end gap-2 border-t border-border bg-white px-6 py-4 shadow-[0_-4px_12px_0_rgb(0_0_0/0.04)] sm:flex-row">
        <Button variant="secondary" type="button" disabled={busy} onClick={safeClose}>Hủy</Button>
        <Button
          type="submit"
          size="lg"
          loading={busy}
          disabled={aiProvidersPending || !selectedAiProviderOption?.configured}
        >
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
