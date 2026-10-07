"use client";
import { X } from "lucide-react";
import { useEffect, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, description, children, className }: PropsWithChildren<{ open: boolean; onClose: () => void; title: string; description?: string; className?: string }>) {
  useEffect(() => { if (!open) return; const listener = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", listener); document.body.style.overflow = "hidden"; return () => { document.removeEventListener("keydown", listener); document.body.style.overflow = ""; }; }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="modal-title" className={cn("max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl", className)}><div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white px-6 py-5"><div><h2 id="modal-title" className="text-lg font-bold">{title}</h2>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng"><X className="size-5" /></Button></div><div className="p-6">{children}</div></section></div>, document.body);
}
