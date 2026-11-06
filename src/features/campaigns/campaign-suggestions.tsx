"use client";

import { Lightbulb, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { resourcesService, type CampaignSuggestion } from "@/services/resources.service";
import type { AiProviderId } from "@/types/domain";

/** The reviewer's criteria, in the order shown on each idea. */
const CRITERIA = [["platformFit", "Hợp mọi nền tảng"], ["readerValue", "Giá trị cho người đọc"], ["brandFit", "Gắn sản phẩm tự nhiên"], ["engagement", "Khả năng tương tác"]] as const;
const scoreTone = (score: number) => score >= 8 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : score >= 6 ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-red-50 text-red-700 ring-red-200";

/**
 * "Gợi ý bằng AI" in the bulk campaign form: ideas for the chosen platforms, built
 * from the brand profile and how earlier campaigns scored and published. Choosing
 * one fills the campaign name and the post description; both stay editable.
 */
export function CampaignSuggestions({ platformSlugs, aiProvider, providerReady, onPick }: {
  platformSlugs: string[];
  aiProvider?: AiProviderId;
  providerReady: boolean;
  onPick: (suggestion: CampaignSuggestion) => void;
}) {
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ forPlatforms: string; suggestions: CampaignSuggestion[]; scored: boolean } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const platformsKey = [...platformSlugs].sort().join(",");
  // Ideas are made for one set of socials: after the selection changes they are hidden until asked again.
  const suggestions = result && result.forPlatforms === platformsKey ? result.suggestions : null;
  const stale = Boolean(result) && !suggestions;
  const blocked = !platformSlugs.length ? "Chọn ít nhất một tài khoản bên dưới để AI gợi ý theo nền tảng." : !providerReady ? "Chọn một nhà cung cấp AI đã cấu hình." : "";

  const suggest = async () => {
    setLoading(true); setError(""); setPicked(null);
    try {
      const answer = await resourcesService.suggestCampaigns({ platformSlugs, hint, aiProvider });
      setResult({ forPlatforms: platformsKey, suggestions: answer.suggestions, scored: answer.scored !== false });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI chưa gợi ý được. Thử lại sau.");
    } finally { setLoading(false); }
  };

  return <section aria-label="Gợi ý chiến dịch" className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <Label htmlFor="suggestion-hint">Gợi ý chiến dịch bằng AI</Label>
        <Input id="suggestion-hint" value={hint} maxLength={300} onChange={(event) => setHint(event.target.value)} placeholder="Hướng muốn nhắm (tuỳ chọn), ví dụ: proxy dân cư cho người làm affiliate" />
      </div>
      <Button type="button" variant="secondary" loading={loading} disabled={Boolean(blocked) || loading} onClick={() => void suggest()}>
        <Sparkles className="size-4" />{suggestions ? "Gợi ý khác" : "Gợi ý"}
      </Button>
    </div>
    <p className="mt-1.5 text-[11px] leading-4 text-muted">
      {blocked || (loading ? `AI đang gợi ý rồi chấm điểm từng gợi ý cho ${platformSlugs.length} nền tảng đã chọn (thường 40–90 giây)…`
        : stale ? `Danh sách social đã đổi. Bấm Gợi ý để có chiến dịch hợp với cả ${platformSlugs.length} nền tảng đang chọn.`
          : `Mỗi gợi ý dùng được cho cả ${platformSlugs.length} nền tảng đã chọn ở trên, được AI chấm điểm và xếp gợi ý tốt nhất lên đầu.`)}
    </p>
    {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    {suggestions && !suggestions.length && !loading && <p className="mt-2 text-sm text-muted">Chưa có gợi ý phù hợp. Thử thêm hướng muốn nhắm rồi bấm lại.</p>}
    {suggestions && suggestions.length > 0 && result && !result.scored && <p className="mt-2 text-[11px] text-amber-800">Lần này AI chưa chấm được điểm; gợi ý hiện theo thứ tự AI đưa ra.</p>}
    {suggestions && suggestions.length > 0 && <ul className="mt-3 grid gap-3 sm:grid-cols-2">
      {suggestions.map((suggestion) => <li key={suggestion.name} className={`flex flex-col rounded-xl border bg-white p-3 ${suggestion.recommended ? "border-emerald-300 ring-2 ring-emerald-100" : "border-border"}`}>
        {suggestion.review && <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ring-1 ${scoreTone(suggestion.review.score)}`}>AI chấm {suggestion.review.score}/10</span>
          {suggestion.recommended && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">Phù hợp nhất</span>}
        </div>}
        <p className="flex items-start gap-1.5 text-sm font-bold text-slate-800"><Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />{suggestion.name}</p>
        {suggestion.angle && <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">{suggestion.angle}</p>}
        <p className="mt-2 line-clamp-5 text-xs leading-5 text-slate-600">{suggestion.brief}</p>
        {suggestion.whyEffective && <p className="mt-2 text-[11px] leading-4 text-emerald-700"><span className="font-semibold">Vì sao hiệu quả: </span>{suggestion.whyEffective}</p>}
        {suggestion.platformFit && <p className="mt-1 text-[11px] leading-4 text-slate-600"><span className="font-semibold">Dùng cho từng nền tảng: </span>{suggestion.platformFit}</p>}
        {suggestion.review && <>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-600" aria-label={`Điểm từng tiêu chí của ${suggestion.name}`}>
            {CRITERIA.map(([key, label]) => <div key={key} className="flex justify-between gap-2"><dt>{label}</dt><dd className="font-semibold tabular-nums text-slate-800">{suggestion.review![key]}/10</dd></div>)}
          </dl>
          {suggestion.review.weakness && <p className="mt-1.5 text-[11px] leading-4 text-amber-800"><span className="font-semibold">Điểm yếu: </span>{suggestion.review.weakness}</p>}
        </>}
        <Button type="button" size="sm" variant={picked === suggestion.name ? "primary" : "secondary"} className="mt-3 self-start" onClick={() => { onPick(suggestion); setPicked(suggestion.name); }}>
          {picked === suggestion.name ? "Đang dùng gợi ý này" : "Dùng gợi ý này"}
        </Button>
      </li>)}
    </ul>}
  </section>;
}
