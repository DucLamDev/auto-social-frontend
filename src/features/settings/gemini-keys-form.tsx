"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Save } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { ErrorState } from "@/components/ui/states";
import { useGeminiKeys } from "@/hooks/use-resources";
import { resourcesService, type GeminiKeysUpdate } from "@/services/resources.service";
import { formatDate } from "@/lib/utils";

export function GeminiKeysForm() {
  const query = useGeminiKeys();
  const client = useQueryClient();
  const [draft, setDraft] = useState<Record<number, { apiKey?: string; clear?: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const changes = Object.entries(draft).flatMap<GeminiKeysUpdate["changes"][number]>(([slot, value]) => value.clear ? [{ slot: Number(slot), clear: true }] : value.apiKey?.trim() ? [{ slot: Number(slot), apiKey: value.apiKey.trim() }] : []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!query.data || !changes.length || saving) return;
    setSaving(true); setError("");
    try {
      // Keep secret inputs out of the query/mutation cache. The response contains slot metadata only.
      const saved = await resourcesService.updateGeminiKeys({ revision: query.data.revision, changes });
      setDraft({});
      client.setQueryData(["gemini-keys"], saved);
      await Promise.all([client.invalidateQueries({ queryKey: ["ai-providers"] }), client.invalidateQueries({ queryKey: ["settings"] })]);
      toast.success("Đã lưu API key Gemini. Các lần tạo nội dung tiếp theo sẽ dùng cấu hình mới.");
    } catch (err) { setError(err instanceof Error ? err.message : "Không lưu được API key. Vui lòng thử lại."); }
    finally { setSaving(false); }
  }

  return <Card className="mb-5 overflow-hidden" id="gemini-keys">
    <div className="flex items-start gap-3 border-b border-border p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-primary"><KeyRound className="size-5" /></span><div><h2 className="font-bold">API key Gemini</h2><p className="mt-1 text-sm text-muted">Tối đa 10 key. Tự chuyển sang key tiếp theo khi key đang dùng hết quota.</p></div>{query.data && <span className="ml-auto whitespace-nowrap rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{query.data.slots.filter((slot) => slot.configured).length}/10 key</span>}</div>
    {query.isPending ? <p className="p-5 text-sm text-muted">Đang tải cấu hình Gemini…</p> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} compact /> : query.data && <form onSubmit={(event) => void save(event)}>
      <div className="px-5 pt-5 text-sm leading-6 text-muted"><p>Key được lưu mã hóa. Để trống ô đã lưu để giữ nguyên; nhập key mới để thay thế hoặc bấm Xóa.</p><p className="mt-1">Các key cùng Google Cloud project dùng chung quota. <a className="text-primary underline" href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer">Xem cách tính quota</a></p></div>
      <fieldset disabled={saving} className="grid gap-4 p-5 sm:grid-cols-2">
        {query.data.slots.map((slot) => <div key={slot.slot} className="rounded-xl border border-border p-4">
          <div className="mb-2 flex items-center justify-between gap-2"><Label htmlFor={`gemini-key-${slot.slot}`} className="mb-0">Gemini API key {slot.slot}</Label><span className="text-xs text-muted">{draft[slot.slot]?.clear ? "Sẽ xóa khi lưu" : slot.retryAt ? "Tạm nghỉ do quota" : slot.active ? "Đang sử dụng" : slot.configured ? "Đã cấu hình" : "Chưa nhập"}</span></div>
          <div className="flex gap-2"><Input id={`gemini-key-${slot.slot}`} type="password" autoComplete="new-password" autoCapitalize="none" spellCheck={false} maxLength={2048} disabled={saving || Boolean(draft[slot.slot]?.clear)} value={draft[slot.slot]?.apiKey ?? ""} placeholder={slot.configured ? "Đã lưu — để trống để giữ nguyên" : "Nhập API key Gemini"} onChange={(event) => { setDraft({ ...draft, [slot.slot]: { apiKey: event.target.value } }); setError(""); }} />{slot.configured && <Button type="button" variant={draft[slot.slot]?.clear ? "secondary" : "ghost"} aria-label={`${draft[slot.slot]?.clear ? "Giữ" : "Xóa"} Gemini key ${slot.slot}`} onClick={() => setDraft({ ...draft, [slot.slot]: { clear: !draft[slot.slot]?.clear } })}>{draft[slot.slot]?.clear ? "Giữ" : "Xóa"}</Button>}</div>
          {slot.retryAt && <p className="mt-2 text-xs text-amber-700">Có thể thử lại từ {formatDate(slot.retryAt)}. Hệ thống đang ưu tiên key khác.</p>}
        </div>)}
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5"><p className="text-xs text-muted">Áp dụng ngay sau khi lưu, không cần khởi động lại.</p><Button type="submit" disabled={!changes.length} loading={saving}><Save className="size-4" />Lưu API key Gemini</Button></div>
      {error && <p role="alert" className="px-5 pb-5 text-sm text-danger">{error}</p>}
    </form>}
  </Card>;
}
