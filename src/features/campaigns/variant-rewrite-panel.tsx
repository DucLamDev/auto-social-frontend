"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/form";
import { useResourceMutation } from "@/hooks/use-resources";
import { resourcesService } from "@/services/resources.service";
import type { ContentVariant } from "@/types/domain";

const MAX_INSTRUCTION = 2000;

/** True while the server is rewriting this draft: its text will be replaced. */
export const isRewriting = (variant: Pick<ContentVariant, "aiRevision">) => variant.aiRevision?.status === "generating";

/**
 * "Viết lại bằng AI" for one platform's draft: the AI rewrites it from your
 * instruction and its last review notes, scores it again and replaces it in
 * place. It runs on the server for a minute or two; the list follows its status.
 */
export function VariantRewritePanel({ variant, editable, unsaved }: { variant: ContentVariant; editable: boolean; unsaved: boolean }) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const rewrite = useResourceMutation((text: string) => resourcesService.rewriteVariant(variant.id, text), ["variants"]);
  const revision = variant.aiRevision;
  const rewriting = isRewriting(variant);
  const lowScore = variant.recommended === false;

  const start = async () => {
    try {
      await rewrite.mutateAsync(instruction);
      setOpen(false);
      setInstruction("");
      toast.success(`AI đang viết lại bài ${variant.platform}. Bài mới sẽ tự hiện và được chấm lại khi xong.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể viết lại bài này"); }
  };

  if (rewriting) {
    return <p role="status" className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
      <Loader2 aria-hidden className="size-4 shrink-0 animate-spin motion-reduce:animate-none" />
      AI đang viết lại bài này{revision?.instruction ? ` theo hướng dẫn “${revision.instruction}”` : ""}, thường mất 1–3 phút. Bài mới sẽ tự hiện và được chấm lại.
    </p>;
  }

  return <div className="space-y-2">
    {revision?.status === "failed" && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Chưa viết lại được: {revision.error || "AI không trả về bài mới."}</p>}
    {revision?.status === "done" && <p className="text-xs text-emerald-700">AI đã viết lại bài này{revision.instruction ? ` theo hướng dẫn “${revision.instruction}”` : ""} và chấm lại.</p>}
    {editable && <PermissionGate allow={["ADMIN", "EDITOR"]}>
      {open ? <div className="space-y-2 rounded-lg border border-border bg-white p-3">
        <Label htmlFor={`rewrite-${variant.id}`}>Hướng dẫn cho AI (không bắt buộc)</Label>
        <Textarea id={`rewrite-${variant.id}`} className="min-h-20" maxLength={MAX_INSTRUCTION} value={instruction} disabled={rewrite.isPending}
          placeholder="Ví dụ: mở bài bằng một con số cụ thể, bớt giọng quảng cáo, thêm lệnh cấu hình nginx"
          onChange={(event) => setInstruction(event.target.value)} />
        <p className="text-xs text-muted">AI tự đọc ghi chú của lần chấm trước. Bài mới thay bài hiện tại, được chấm lại; chưa đạt thì AI tự sửa thêm.</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" loading={rewrite.isPending} onClick={() => void start()}><Sparkles className="size-4" />Viết lại</Button>
          <Button size="sm" variant="ghost" disabled={rewrite.isPending} onClick={() => setOpen(false)}>Huỷ</Button>
        </div>
      </div>
        : <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={lowScore ? "primary" : "secondary"} disabled={unsaved} onClick={() => setOpen(true)}><Sparkles className="size-4" />Viết lại bằng AI</Button>
          {unsaved ? <span className="text-xs text-amber-700">Lưu hoặc bỏ phần đang sửa của bài này trước khi viết lại.</span>
            : lowScore && <span className="text-xs text-muted">AI viết lại theo ghi chú chấm điểm để đạt điểm cao hơn.</span>}
        </div>}
    </PermissionGate>}
  </div>;
}
