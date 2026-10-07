"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { Modal } from "./modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  busy = false,
  danger = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return <Modal open={open} onClose={() => { if (!busy) onClose(); }} title={title} description={description}>
    <div className="space-y-5">
      <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-6 ${danger ? "border-rose-100 bg-rose-50 text-rose-900" : "border-amber-100 bg-amber-50 text-amber-900"}`}>
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <p>Hành động chỉ được thực hiện sau khi bạn xác nhận tại đây.</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>{cancelLabel}</Button>
        <Button type="button" loading={busy} variant={danger ? "danger" : "primary"} onClick={() => void onConfirm()}>{confirmLabel}</Button>
      </div>
    </div>
  </Modal>;
}
