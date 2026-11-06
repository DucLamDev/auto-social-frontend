"use client";

import { Lightbulb, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { resourcesService, type CampaignSuggestion } from "@/services/resources.service";
import type { AiProviderId } from "@/types/domain";

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
  const [suggestions, setSuggestions] = useState<CampaignSuggestion[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const blocked = !platformSlugs.length ? "Chọn ít nhất một tài khoản bên dưới để AI gợi ý theo nền tảng." : !providerReady ? "Chọn một nhà cung cấp AI đã cấu hình." : "";

  const suggest = async () => {
    setLoading(true); setError(""); setPicked(null);
    try {
      const result = await resourcesService.suggestCampaigns({ platformSlugs, hint, aiProvider });
      setSuggestions(result.suggestions);
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
      {blocked || (loading ? "AI đang đọc thông tin công ty, các nền tảng đã chọn và kết quả các chiến dịch trước (thường 20–60 giây)…" : "Gợi ý hợp với công ty và các nền tảng đã chọn, dựa trên điểm AI và số bài đã đăng của các chiến dịch trước.")}
    </p>
    {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    {suggestions && !suggestions.length && !loading && <p className="mt-2 text-sm text-muted">Chưa có gợi ý phù hợp. Thử thêm hướng muốn nhắm rồi bấm lại.</p>}
    {suggestions && suggestions.length > 0 && <ul className="mt-3 grid gap-3 sm:grid-cols-2">
      {suggestions.map((suggestion) => <li key={suggestion.name} className="flex flex-col rounded-xl border border-border bg-white p-3">
        <p className="flex items-start gap-1.5 text-sm font-bold text-slate-800"><Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />{suggestion.name}</p>
        {suggestion.angle && <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">{suggestion.angle}</p>}
        <p className="mt-2 line-clamp-5 text-xs leading-5 text-slate-600">{suggestion.brief}</p>
        {suggestion.whyEffective && <p className="mt-2 text-[11px] leading-4 text-emerald-700"><span className="font-semibold">Vì sao hiệu quả: </span>{suggestion.whyEffective}</p>}
        {suggestion.bestFor.length > 0 && <p className="mt-1 text-[11px] text-muted">Hợp nhất với: {suggestion.bestFor.join(", ")}</p>}
        <Button type="button" size="sm" variant={picked === suggestion.name ? "primary" : "secondary"} className="mt-3 self-start" onClick={() => { onPick(suggestion); setPicked(suggestion.name); }}>
          {picked === suggestion.name ? "Đang dùng gợi ý này" : "Dùng gợi ý này"}
        </Button>
      </li>)}
    </ul>}
  </section>;
}
