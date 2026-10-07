"use client";

import { Braces, Check, Save, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Switch, Textarea } from "@/components/ui/form";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";
import { usePrompts, useResourceMutation } from "@/hooks/use-resources";
import { cn, formatDate } from "@/lib/utils";
import { resourcesService } from "@/services/resources.service";
import type { PromptTemplate } from "@/types/domain";

const placeholders = ["platform", "title", "body", "summary", "canonicalUrl"];

function PromptEditor({ prompt }: { prompt: PromptTemplate }) {
  const [systemPrompt, setSystemPrompt] = useState(prompt.systemPrompt);
  const [userPrompt, setUserPrompt] = useState(prompt.userPrompt ?? "");
  const [active, setActive] = useState(prompt.active);
  const update = useResourceMutation(() => resourcesService.updatePrompt(prompt.id, { systemPrompt, userPrompt, active }), ["prompts"]);

  return <div>
    <div className="flex flex-wrap items-start gap-3 border-b border-border px-6 py-5">
      <PlatformMark slug={prompt.platformSlug} name={prompt.platform} size="lg" />
      <div className="mr-auto"><p className="font-bold">{prompt.name}</p><p className="mt-1 text-xs text-muted">Phiên bản {prompt.version} · cập nhật {formatDate(prompt.updatedAt)}</p></div>
      <Badge value={active ? "ACTIVE" : "INACTIVE"} />
      <PermissionGate allow={["ADMIN"]}><Switch checked={active} onChange={setActive} label="Kích hoạt prompt" /></PermissionGate>
    </div>
    <div className="space-y-5 p-6">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-xs leading-6 text-indigo-800">
        <div className="mb-2 flex items-center gap-2 font-bold"><Braces className="size-4" />Biến runtime được backend hỗ trợ</div>
        <div className="flex flex-wrap gap-1.5">{placeholders.map((placeholder) => <code key={placeholder} className="rounded bg-white px-1.5 py-0.5">{`{{${placeholder}}}`}</code>)}</div>
      </div>
      <div><Label htmlFor="system-prompt">System prompt</Label><Textarea id="system-prompt" value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} className="min-h-48 font-mono text-xs leading-6" /></div>
      <div><Label htmlFor="user-prompt">User prompt template</Label><Textarea id="user-prompt" value={userPrompt} onChange={(event) => setUserPrompt(event.target.value)} className="min-h-40 font-mono text-xs leading-6" /></div>
      <PermissionGate allow={["ADMIN"]} fallback={<p className="rounded-xl bg-slate-50 p-3 text-xs text-muted">Chỉ ADMIN có quyền chỉnh sửa prompt template.</p>}>
        <div className="flex justify-end"><Button loading={update.isPending} onClick={() => void update.mutateAsync(undefined).then(() => toast.success("Đã lưu phiên bản prompt mới")).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể lưu"))}><Save className="size-4" />Lưu phiên bản mới</Button></div>
      </PermissionGate>
    </div>
  </div>;
}

export function PromptsView() {
  const query = usePrompts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (query.isPending) return <PageLoader />;
  if (query.isError) return <><PageHeader title="Prompt templates" /><Card><ErrorState error={query.error} onRetry={() => void query.refetch()} /></Card></>;
  const items = query.data.items;
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  return <div className="animate-enter">
    <PageHeader eyebrow="AI Engine" title="Prompt templates" description="Mỗi lần lưu tạo một version mới ở backend; prompt không được hard-code trong connector." />
    {!items.length ? <Card><EmptyState title="Chưa có prompt template" description="Chạy seed prompts ở backend để tạo template theo nền tảng." /></Card> : <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
      <Card className="self-start overflow-hidden"><div className="border-b border-border px-4 py-4"><p className="text-xs font-bold text-slate-500">Nền tảng</p></div><div className="max-h-[680px] overflow-y-auto p-2">{items.map((prompt) => <button key={prompt.id} onClick={() => setSelectedId(prompt.id)} className={cn("flex w-full items-center gap-3 rounded-xl p-3 text-left transition", selected?.id === prompt.id ? "bg-primary-soft text-primary" : "hover:bg-slate-50")}><PlatformMark slug={prompt.platformSlug} name={prompt.platform} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{prompt.platform}</span><span className="mt-0.5 block truncate text-[10px] text-muted">v{prompt.version} · {prompt.active ? "active" : "inactive"}</span></span>{selected?.id === prompt.id ? <Check className="size-4" /> : <Sparkles className="size-3.5 text-slate-300" />}</button>)}</div></Card>
      {selected && <Card className="overflow-hidden"><PromptEditor key={selected.id} prompt={selected} /></Card>}
    </div>}
  </div>;
}
