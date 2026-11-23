"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Info, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/form";
import { ErrorState } from "@/components/ui/states";
import { useBrandProfile } from "@/hooks/use-resources";
import { formatDate } from "@/lib/utils";
import { resourcesService, type BrandProfileContent, type BrandProfileView } from "@/services/resources.service";

/** The limits the server checks (BrandProfileContentSchema), shown next to the field before saving. */
const LIMITS = { brandName: 120, oneLiner: 300, audience: 500, voice: 500, disclosure: 200, fact: 300, facts: 30, avoidItem: 200, avoid: 20, linkLabel: 80, linkUrl: 500, links: 10 } as const;

type Link = { label: string; url: string };
type Draft = { brandName: string; oneLiner: string; audience: string; voice: string; facts: string; links: Link[]; disclosure: string; avoid: string };
type Field = "brandName" | "oneLiner" | "audience" | "voice" | "facts" | "links" | "disclosure" | "avoid";
type Errors = Partial<Record<Field, { message: string; focus: string }>>;

const FIELD_ORDER: Field[] = ["brandName", "oneLiner", "audience", "voice", "facts", "links", "disclosure", "avoid"];

function toDraft(profile: BrandProfileContent): Draft {
  return {
    brandName: profile.brandName ?? "", oneLiner: profile.oneLiner ?? "", audience: profile.audience ?? "", voice: profile.voice ?? "",
    facts: (profile.facts ?? []).join("\n"), links: (profile.links ?? []).map((link) => ({ ...link })),
    disclosure: profile.disclosure ?? "", avoid: (profile.avoid ?? []).join("\n"),
  };
}

const lines = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean);

/** What is sent: trimmed; empty fields, blank lines and empty link rows are left out (undefined is not sent). */
function toProfile(draft: Draft): BrandProfileContent {
  const text = (value: string) => value.trim() || undefined;
  const list = <T,>(items: T[]) => (items.length ? items : undefined);
  return {
    brandName: text(draft.brandName), oneLiner: text(draft.oneLiner), audience: text(draft.audience), voice: text(draft.voice),
    facts: list(lines(draft.facts)),
    links: list(draft.links.map((link) => ({ label: link.label.trim(), url: link.url.trim() })).filter((link) => link.label || link.url)),
    disclosure: text(draft.disclosure), avoid: list(lines(draft.avoid)),
  };
}

function validate(draft: Draft): Errors {
  const errors: Errors = {};
  const single = (field: "brandName" | "oneLiner" | "audience" | "voice" | "disclosure") => {
    if (draft[field].trim().length > LIMITS[field]) errors[field] = { message: `Dài quá ${LIMITS[field]} ký tự.`, focus: `brand-${field}` };
  };
  (["brandName", "oneLiner", "audience", "voice", "disclosure"] as const).forEach(single);
  const perLine = (field: "facts" | "avoid", maxLines: number, maxChars: number) => {
    const items = lines(draft[field]);
    const long = items.findIndex((item) => item.length > maxChars);
    if (items.length > maxLines) errors[field] = { message: `Nhiều quá ${maxLines} dòng (đang có ${items.length}).`, focus: `brand-${field}` };
    else if (long >= 0) errors[field] = { message: `Dòng ${long + 1} dài quá ${maxChars} ký tự.`, focus: `brand-${field}` };
  };
  perLine("facts", LIMITS.facts, LIMITS.fact);
  perLine("avoid", LIMITS.avoid, LIMITS.avoidItem);
  for (const [index, link] of draft.links.entries()) {
    const label = link.label.trim(), url = link.url.trim(), row = index + 1;
    if (!label && !url) continue;
    const problem = !label ? { message: `Liên kết ${row}: nhập tên liên kết.`, focus: `brand-link-label-${index}` }
      : !url ? { message: `Liên kết ${row}: nhập địa chỉ.`, focus: `brand-link-url-${index}` }
        : label.length > LIMITS.linkLabel ? { message: `Liên kết ${row}: tên dài quá ${LIMITS.linkLabel} ký tự.`, focus: `brand-link-label-${index}` }
          : url.length > LIMITS.linkUrl || !/^https?:\/\/[^\s/?#]+\.[^\s]+$/i.test(url) ? { message: `Liên kết ${row}: địa chỉ phải là một trang web đầy đủ, bắt đầu bằng https:// (ví dụ https://vpsttt.com/bang-gia).`, focus: `brand-link-url-${index}` }
            : null;
    if (problem) { errors.links = problem; break; }
  }
  return errors;
}

/** Brand profile the AI writes with: what it may say about the company, and what it must never say. */
export function BrandProfileForm() {
  const query = useBrandProfile();
  return <Card className="mb-5 overflow-hidden" id="brand-profile">
    <div className="flex flex-wrap items-start gap-3 border-b border-border p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-primary"><Building2 className="size-5" /></span>
      <div className="min-w-0 flex-1"><h2 className="font-bold">Hồ sơ thương hiệu</h2><p className="mt-1 text-sm text-muted">Điều AI được nói về VPSTTT và điều không bao giờ được nói, khi viết mọi bài.</p></div>
      {query.data && <StatusPill view={query.data} />}
    </div>
    {query.isPending ? <p className="p-5 text-sm text-muted">Đang tải hồ sơ thương hiệu…</p>
      : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} compact />
        : <BrandProfileEditor view={query.data} />}
  </Card>;
}

function StatusPill({ view }: { view: BrandProfileView }) {
  const [label, tone] = view.profile ? ["AI đang dùng", "bg-emerald-50 text-emerald-700"] : view.invalid ? ["AI đang bỏ qua", "bg-amber-50 text-amber-800"] : ["Chưa lưu", "bg-slate-100 text-slate-600"];
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function BrandProfileEditor({ view }: { view: BrandProfileView }) {
  const client = useQueryClient();
  const start = view.profile ?? view.suggested;
  // null until the operator edits: the form then follows what the server holds.
  const [edited, setEdited] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const draft = edited ?? toDraft(start);
  const profile = toProfile(draft);
  const changed = !view.profile || JSON.stringify(profile) !== JSON.stringify(toProfile(toDraft(view.profile)));

  function change(patch: Partial<Draft>, field: Field) {
    setEdited({ ...draft, ...patch });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
    setServerError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const found = validate(draft);
    setErrors(found);
    const first = FIELD_ORDER.map((field) => found[field]).find(Boolean);
    if (first) { document.getElementById(first.focus)?.focus(); return; }
    setSaving(true); setServerError("");
    try {
      const saved = await resourcesService.updateBrandProfile(profile);
      client.setQueryData(["brand-profile"], saved);
      setEdited(null);
      toast.success("Đã lưu hồ sơ thương hiệu. Các bài AI viết từ giờ dùng hồ sơ này.");
    } catch (error) { setServerError(error instanceof Error ? error.message : "Không lưu được hồ sơ thương hiệu. Vui lòng thử lại."); }
    finally { setSaving(false); }
  }

  const describe = (field: Field, hint?: string) => [hint, errors[field] ? `brand-${field}-error` : undefined].filter(Boolean).join(" ") || undefined;
  const textField = (field: "brandName" | "oneLiner" | "disclosure", label: string, placeholder: string, hint?: string) => <div className={field === "disclosure" ? "sm:col-span-2" : undefined}>
    <Label htmlFor={`brand-${field}`}>{label}</Label>
    {hint && <p id={`brand-${field}-hint`} className="-mt-0.5 mb-2 text-xs leading-5 text-muted">{hint}</p>}
    <Input id={`brand-${field}`} value={draft[field]} placeholder={placeholder} aria-invalid={Boolean(errors[field])} aria-describedby={describe(field, hint ? `brand-${field}-hint` : undefined)} onChange={(event) => change({ [field]: event.target.value } as Partial<Draft>, field)} />
    <FieldError id={`brand-${field}-error`}>{errors[field]?.message}</FieldError>
  </div>;
  const areaField = (field: "audience" | "voice" | "facts" | "avoid", label: string, placeholder: string, hint: string) => <div>
    <Label htmlFor={`brand-${field}`}>{label}</Label>
    <p id={`brand-${field}-hint`} className="-mt-0.5 mb-2 text-xs leading-5 text-muted">{hint}</p>
    <Textarea id={`brand-${field}`} rows={field === "facts" || field === "avoid" ? 6 : 3} className={field === "facts" || field === "avoid" ? "min-h-40" : "min-h-24"} value={draft[field]} placeholder={placeholder} aria-invalid={Boolean(errors[field])} aria-describedby={describe(field, `brand-${field}-hint`)} onChange={(event) => change({ [field]: event.target.value } as Partial<Draft>, field)} />
    <FieldError id={`brand-${field}-error`}>{errors[field]?.message}</FieldError>
  </div>;

  return <form noValidate onSubmit={(event) => void save(event)}>
    {!view.profile && <div className={`mx-5 mt-5 flex gap-3 rounded-2xl border p-4 text-sm leading-6 ${view.invalid ? "border-amber-200 bg-amber-50 text-amber-900" : "border-indigo-100 bg-indigo-50 text-indigo-900"}`}>
      <Info className="mt-0.5 size-5 shrink-0" />
      <p>{view.invalid
        ? "Hồ sơ đang lưu không hợp lệ (có thể do sửa tay bằng JSON). Form đã điền sẵn bản gợi ý: xem lại rồi lưu để thay hồ sơ đó."
        : "Form đã điền sẵn bản gợi ý lấy từ thông tin VPSTTT đã công bố. Xem lại, sửa cho đúng rồi lưu để AI bắt đầu dùng."}</p>
    </div>}
    <fieldset disabled={saving} className="grid gap-5 p-5 sm:grid-cols-2">
      {textField("brandName", "Tên thương hiệu", "VPSTTT")}
      {textField("oneLiner", "Giới thiệu một câu", "Nhà cung cấp VPS và proxy tại Việt Nam.")}
      {areaField("audience", "Người đọc", "Lập trình viên, quản trị hệ thống, shop online cần VPS hoặc proxy ổn định", "Bài viết cho ai: nghề, nhu cầu, trình độ.")}
      {areaField("voice", "Giọng văn", "Rõ ràng, thân thiện như kỹ sư nói với kỹ sư; không phóng đại", "Cách viết: xưng hô, độ trang trọng, điều nên tránh trong cách nói.")}
      {areaField("facts", "Thông tin AI được dùng", "Máy chủ đặt tại datacenter VNPT, Viettel, FPT, CMC", `Mỗi dòng một điều có thật (dịch vụ, cấu hình, giá đã công bố), tối đa ${LIMITS.facts} dòng. Về công ty, AI chỉ nói điều có ở đây hoặc trong mô tả bài.`)}
      {areaField("avoid", "Điều không được nói", "Rẻ nhất thị trường", `Mỗi dòng một điều, tối đa ${LIMITS.avoid} dòng. AI không viết những điều này; AI chấm bài coi là lỗi.`)}
      <fieldset className="min-w-0 sm:col-span-2" aria-describedby={describe("links", "brand-links-hint")}>
        <legend className="mb-1.5 text-sm font-semibold text-slate-700">Liên kết AI được dẫn vào bài</legend>
        <p id="brand-links-hint" className="-mt-0.5 mb-2 text-xs leading-5 text-muted">Trang cụ thể như bảng giá, hướng dẫn; tối đa {LIMITS.links} liên kết. Không cần trang chủ: hệ thống tự thêm website vào cuối bài trên kênh của công ty.</p>
        {draft.links.length === 0 && <p className="mb-3 text-sm text-muted">Chưa có liên kết nào.</p>}
        <div className="space-y-3">
          {draft.links.map((link, index) => <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
            <Input id={`brand-link-label-${index}`} aria-label={`Tên liên kết ${index + 1}`} placeholder="Bảng giá VPS" value={link.label} onChange={(event) => change({ links: draft.links.map((item, at) => (at === index ? { ...item, label: event.target.value } : item)) }, "links")} />
            <Input id={`brand-link-url-${index}`} type="url" inputMode="url" autoCapitalize="none" spellCheck={false} aria-label={`Địa chỉ liên kết ${index + 1}`} placeholder="https://vpsttt.com/bang-gia" value={link.url} onChange={(event) => change({ links: draft.links.map((item, at) => (at === index ? { ...item, url: event.target.value } : item)) }, "links")} />
            <Button type="button" variant="ghost" className="size-11 p-0" aria-label={`Xoá liên kết ${index + 1}`} onClick={() => change({ links: draft.links.filter((_, at) => at !== index) }, "links")}><Trash2 className="size-4" /></Button>
          </div>)}
        </div>
        {draft.links.length < LIMITS.links && <Button type="button" variant="secondary" className="mt-3 h-11" onClick={() => change({ links: [...draft.links, { label: "", url: "" }] }, "links")}><Plus className="size-4" />Thêm liên kết</Button>}
        <FieldError id="brand-links-error">{errors.links?.message}</FieldError>
      </fieldset>
      {textField("disclosure", "Câu tự giới thiệu ở diễn đàn", "Mình làm ở VPSTTT, bên cung cấp VPS và proxy.", "AI dùng khi đăng ở diễn đàn, cộng đồng, nơi người viết phải nói rõ mình làm ở công ty.")}
    </fieldset>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
      <p className="text-xs text-muted">{view.profile && view.updatedAt ? `Lưu lần cuối ${formatDate(view.updatedAt)}. ` : ""}Áp dụng cho các bài AI viết sau khi lưu.</p>
      <Button type="submit" className="h-11" disabled={!changed} loading={saving}><Save className="size-4" />Lưu hồ sơ thương hiệu</Button>
    </div>
    {serverError && <p role="alert" className="px-5 pb-5 text-sm text-danger">{serverError}</p>}
  </form>;
}
