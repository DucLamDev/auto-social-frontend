"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Bot, CheckCircle2, Clock3, ImagePlus, Send, Sparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { accountChannel, type AccountChannel } from "@/features/accounts/extension-account-state";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Switch, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { automationCampaignSchema, type AutomationCampaignInput } from "@/schemas/campaign";
import { aiImageProviderLabel, type AiImageStatus, type AiProviderOption, type AiRoles, type PlatformAccount } from "@/types/domain";
import { CampaignSuggestions } from "./campaign-suggestions";
import { canAddAutomationAccount, countAutomationPlatforms, defaultAutomationAccountIds, getAutomationAccountBlocker, isAutomationAccountEligible, MAX_AUTOMATION_PLATFORMS, sameAiModel, writerLabel } from "./campaign-utils";

type AutomationCampaignModalProps = {
  open: boolean;
  accounts: PlatformAccount[];
  /** Accounts tab the run starts from: only its accounts are selected at first (all stay selectable). */
  channel?: AccountChannel;
  accountsPending?: boolean;
  accountsError?: unknown;
  aiProviders: AiProviderOption[];
  aiProvidersPending?: boolean;
  aiProvidersError?: unknown;
  /** Reviewer and final approver configured on the server; null/undefined (older backends) hides the three-role line. */
  aiRoles?: AiRoles | null;
  /** Whether VPSTTT AI image generation is configured on the backend. */
  imageGeneration?: AiImageStatus;
  imageGenerationPending?: boolean;
  submitError?: string | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: AutomationCampaignInput) => Promise<void> | void;
};

const defaultValues: AutomationCampaignInput = {
  name: "",
  brief: "",
  imageAltText: "",
  generateImages: true,
  autoPublish: false,
  accountIds: [],
  aiProvider: "openai",
  runMode: "NOW",
  scheduledAt: "",
  confirmAutoPublish: true,
};

export function AutomationCampaignModal({
  open,
  accounts,
  channel,
  accountsPending = false,
  accountsError,
  aiProviders,
  aiProvidersPending = false,
  aiProvidersError,
  aiRoles,
  imageGeneration,
  imageGenerationPending = false,
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
  const generateImages = useWatch({ control: form.control, name: "generateImages" });
  const autoPublish = useWatch({ control: form.control, name: "autoPublish" }) === true;
  const chosenImage = useWatch({ control: form.control, name: "image" });
  const aiImagesAvailable = imageGeneration?.configured === true;
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
  const defaultAccountIds = useMemo(
    () => defaultAutomationAccountIds(channel ? eligibleAccounts.filter((account) => accountChannel(account) === channel) : eligibleAccounts),
    [eligibleAccounts, channel],
  );
  const selectedPlatformCount = countAutomationPlatforms(eligibleAccounts, selectedAccountIds);
  // Suggestions are planned for the platforms of the accounts ticked below.
  const selectedPlatformSlugs = [...new Set(eligibleAccounts
    .filter((account) => (selectedAccountIds ?? []).includes(account.id))
    .map((account) => account.platform?.slug)
    .filter((slug): slug is string => Boolean(slug)))];
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
    // Pixelfed posts are photos: an uploaded image of at most 20 MiB, or one AI creates.
    const pixelfed = accounts.some(account => values.accountIds.includes(account.id) && account.settings?.extensionEngine === "pixelfed");
    if (pixelfed && values.image && values.image.size > 20 * 1024 * 1024) {
      form.setError("image", { type: "manual", message: "Pixelfed nhận ảnh tối đa 20 MiB. Chọn ảnh nhỏ hơn." });
      return;
    }
    if (pixelfed && !values.image && !(values.generateImages !== false && aiImagesAvailable)) {
      form.setError("image", { type: "manual", message: "Pixelfed cần ảnh. Bật \"AI tạo ảnh\" hoặc thêm ảnh để đăng cùng các nền tảng đã chọn." });
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
    title="Tạo nội dung AI chạy ngầm"
    description="Chọn các social cần đăng trước, rồi nhờ AI gợi ý chiến dịch hợp với tất cả các social đó hoặc tự nhập mô tả. AI viết bài ở chế độ nền; bạn duyệt một lần trong tab Content đợi duyệt là bài tự đăng lên social."
    className="max-w-3xl"
  >
    <form className="space-y-6" onSubmit={submit}>
      <div className="grid gap-2 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-4 sm:grid-cols-3">
        <FlowStep icon={<Bot className="size-4" />} number="1" label="AI viết bài" />
        <FlowStep icon={<CheckCircle2 className="size-4" />} number="2" label={autoPublish ? "Bài đạt tự duyệt" : "Bạn duyệt một lần"} />
        <FlowStep icon={<Send className="size-4" />} number="3" label="Tự đăng lên social" />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <Label className="mb-0">Đăng tới tài khoản</Label>
            <p className="mt-1 text-xs text-muted">Các tài khoản đã kết nối và bật đăng tự động được chọn sẵn. Bạn có thể bỏ những kênh không muốn đăng. Số ở góc phải mỗi thẻ là số bài đã đăng bằng tài khoản đó.</p>
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
                  const published = account.publishedCount;
                  return <label
                    key={account.id}
                    className={`relative flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 transition ${checked ? "border-indigo-300 ring-2 ring-indigo-100" : "border-border hover:border-slate-300"}`}
                  >
                    {/* Posts already live through this account, to spread a new batch over less-used channels. */}
                    {published !== undefined && <span
                      title={`Đã đăng ${published} bài bằng tài khoản này`}
                      aria-label={`Đã đăng ${published} bài`}
                      className={`absolute right-2 top-1.5 min-w-5 rounded-full px-1.5 text-center text-[10px] font-bold leading-4 tabular-nums ${published ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-500"}`}
                    >{published}</span>}
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
                    <span className={`min-w-0 ${published !== undefined ? "pr-7" : ""}`}>
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
              ? "Đã chọn sẵn AI của workspace. Bạn có thể giữ nguyên để tạo nội dung."
              : "AI này chưa được cấu hình cho workspace."}
          </p>}
        {aiRoles && selectedAiProviderOption && <AiRolesLine writer={selectedAiProviderOption} roles={aiRoles} />}
      </div>

      <CampaignSuggestions
        platformSlugs={selectedPlatformSlugs}
        aiProvider={selectedAiProviderOption?.configured ? selectedAiProviderOption.id : undefined}
        providerReady={selectedAiProviderOption?.configured === true}
        onPick={(suggestion) => {
          form.setValue("name", suggestion.name, { shouldDirty: true, shouldValidate: true });
          form.setValue("brief", suggestion.brief, { shouldDirty: true, shouldValidate: true });
        }}
      />

      <div>
        <Label htmlFor="automation-brief">Mô tả bài đăng</Label>
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
            <p className="text-sm font-semibold text-slate-700">Ảnh cho bài đăng</p>
            <p className="mt-1 text-xs leading-5 text-muted">Chỉ kênh gửi được ảnh mới có ảnh: Pixelfed, Bluesky, Mastodon, Tumblr, LinkedIn qua tiện ích Chrome; X, Discord, dev.to, Threads, Instagram qua API. Diễn đàn và các kênh khác chỉ đăng chữ.</p>
          </div>
        </div>
        <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-border bg-white p-3">
          <div className="min-w-0">
            <p id="automation-generate-images-label" className="text-sm font-semibold text-foreground">AI tạo ảnh cho kênh cần ảnh</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              {imageGenerationPending ? "Đang kiểm tra cấu hình tạo ảnh…"
                : !aiImagesAvailable ? `Máy chủ chưa bật tạo ảnh bằng ${aiImageProviderLabel(imageGeneration)} (cần key có quyền tạo ảnh). Bài vẫn được tạo, chỉ không có ảnh AI.`
                  : chosenImage ? "Đã chọn ảnh của bạn: ảnh này dùng thay ảnh AI cho mọi kênh hỗ trợ ảnh."
                    : `Mỗi kênh một ảnh riêng hợp khổ và phong cách của kênh, tạo bằng ${aiImageProviderLabel(imageGeneration)}; mỗi ảnh mất khoảng 30 giây đến 2 phút. Bạn xem, tạo lại hoặc bỏ ảnh khi duyệt.`}
            </p>
          </div>
          <div className="shrink-0 pt-0.5"><Controller
            control={form.control}
            name="generateImages"
            render={({ field }) => <Switch
              checked={field.value !== false && aiImagesAvailable && !chosenImage}
              disabled={!aiImagesAvailable || Boolean(chosenImage) || busy}
              label="AI tạo ảnh cho kênh cần ảnh"
              onChange={(checked) => { form.clearErrors("image"); field.onChange(checked); }}
            />}
          /></div>
        </div>
        <Label htmlFor="automation-image">Hoặc dùng ảnh của bạn (tuỳ chọn)</Label>
        <p className="-mt-1 mb-2 text-xs leading-5 text-muted">JPEG, PNG hoặc WebP, tối đa 50 MiB; Pixelfed tối đa 20 MiB. Ảnh được tải lên một lần và dùng chung cho các kênh hỗ trợ ảnh.</p>
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
          {generateImages !== false && aiImagesAvailable && !chosenImage
            ? "Bài cho kênh không gửi được ảnh được viết chỉ bằng chữ và không nhắc tới ảnh."
            : "Ảnh được gửi tới các kênh hỗ trợ ảnh; các kênh còn lại đăng nội dung văn bản."}
        </p>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-slate-50/70 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Tự đăng bài AI chấm đạt, không cần duyệt</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">
            {autoPublish
              ? "Kênh nào AI viết xong (kèm ảnh) và tự chấm đạt thì đăng luôn. Bài chưa đạt vẫn chờ bạn duyệt trong Content đợi duyệt."
              : "Tắt: mọi bài chờ bạn duyệt một lần; kênh nào xong là duyệt được ngay, duyệt xong bài tự đăng."}
          </p>
        </div>
        <div className="shrink-0 pt-0.5"><Controller
          control={form.control}
          name="autoPublish"
          render={({ field }) => <Switch checked={field.value === true} disabled={busy} label="Tự đăng bài AI chấm đạt, không cần duyệt" onChange={field.onChange} />}
        /></div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-700">Thời điểm đăng</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${runMode === "NOW" ? "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-100" : "border-border"}`}>
            <input type="radio" value="NOW" className="mt-1 accent-indigo-600" {...form.register("runMode")} />
            <Zap className="mt-0.5 size-4 shrink-0 text-indigo-600" />
            <span><span className="block text-sm font-bold">Ngay khi duyệt</span><span className="mt-0.5 block text-xs leading-5 text-muted">{autoPublish ? "Bài đạt đăng ngay khi viết xong; bài khác đăng ngay khi bạn duyệt." : "Bài đăng ngay khi bạn bấm duyệt."}</span></span>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${runMode === "SCHEDULED" ? "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-100" : "border-border"}`}>
            <input type="radio" value="SCHEDULED" className="mt-1 accent-indigo-600" {...form.register("runMode")} />
            <Clock3 className="mt-0.5 size-4 shrink-0 text-indigo-600" />
            <span><span className="block text-sm font-bold">Lên lịch</span><span className="mt-0.5 block text-xs leading-5 text-muted">Bài đã duyệt tự đăng khi đến giờ hẹn.</span></span>
          </label>
        </div>
        {runMode === "SCHEDULED" && <div className="mt-3">
          <Label htmlFor="automation-date">Ngày giờ bắt đầu</Label>
          <Input id="automation-date" type="datetime-local" {...form.register("scheduledAt")} />
          <FieldError>{form.formState.errors.scheduledAt?.message}</FieldError>
        </div>}
      </fieldset>

      <p className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-950">AI sẽ tạo nội dung chạy ngầm cho {selectedAccountIds.length} tài khoản đã chọn. Bạn có thể tiếp tục làm việc hoặc đóng trang. {autoPublish ? "Bài AI chấm đạt tự đăng; bài chưa đạt chờ bạn duyệt trong tab Content đợi duyệt." : "Duyệt một lần trong tab Content đợi duyệt là bài tự đăng, không cần bấm thêm."}</p>

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
          Tạo bằng AI chạy ngầm
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

/**
 * The three AI roles of a run: the chosen provider writes, the server's reviewer scores and the
 * final approver gives the last yes. Warns when the writer is the same model as a judge (it would
 * grade its own work) or when a judge is not configured.
 */
function AiRolesLine({ writer, roles }: { writer: AiProviderOption; roles: AiRoles }) {
  const steps = [
    { role: "Viết", label: writerLabel(writer) },
    { role: "Chấm", label: roles.reviewer.label },
    ...(roles.approvalEnabled ? [{ role: "Duyệt cuối", label: roles.approver.label }] : []),
  ];
  const same = [
    sameAiModel(writer, roles.reviewer) ? "AI chấm" : null,
    roles.approvalEnabled && sameAiModel(writer, roles.approver) ? "AI duyệt cuối" : null,
  ].filter((role): role is string => Boolean(role));
  // The server falls back to the writer for an unconfigured reviewer; an unconfigured approver fails every approval.
  const unconfigured = [
    roles.reviewer.configured ? null : `AI chấm (${roles.reviewer.label}) chưa được cấu hình trên máy chủ: bài sẽ do chính AI viết tự chấm.`,
    roles.approvalEnabled && !roles.approver.configured ? `AI duyệt cuối (${roles.approver.label}) chưa được cấu hình trên máy chủ: bài sẽ không qua được bước duyệt cuối.` : null,
  ].filter((problem): problem is string => Boolean(problem));
  return <section aria-label="Ba vai AI" className="mt-3 rounded-xl border border-border bg-slate-50/70 px-3 py-2 text-xs text-slate-700">
    <p className="leading-6">{steps.map((step, index) => <span key={step.role}>
      {index > 0 && <span aria-hidden className="text-slate-400"> → </span>}
      <span className="whitespace-nowrap"><span className="font-semibold text-slate-500">{step.role}:</span> <span className="font-semibold text-slate-900">{step.label}</span></span>
    </span>)}</p>
    {same.length > 0 && <p className="mt-1.5 flex items-start gap-1.5 text-amber-800"><AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />AI viết trùng {same.join(" và ")} nên kết quả kém khách quan. Chọn AI viết khác để bài được chấm và duyệt độc lập.</p>}
    {unconfigured.length > 0 && <p className="mt-1.5 flex items-start gap-1.5 text-amber-800"><AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" /><span>{unconfigured.join(" ")} Nhờ quản trị cấu hình trước khi tạo bài.</span></p>}
  </section>;
}
