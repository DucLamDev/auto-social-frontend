import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) { return <label className={cn("mb-1.5 block text-sm font-semibold text-slate-700", className)} {...props} />; }
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 disabled:bg-slate-50", className)} {...props} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn("min-h-28 w-full resize-y rounded-xl border border-border bg-white px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-primary/60 focus:ring-4 focus:ring-primary/10", className)} {...props} />;
});
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return <div className="relative"><select ref={ref} className={cn("h-11 w-full appearance-none rounded-xl border border-border bg-white px-3.5 pr-9 text-sm outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10", className)} {...props}>{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 text-slate-400" /></div>;
});
export function FieldError({ children }: { children?: React.ReactNode }) { return children ? <p role="alert" className="mt-1.5 text-xs font-medium text-danger">{children}</p> : null; }
export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange?: (checked: boolean) => void; disabled?: boolean; label?: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange?.(!checked)} className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-primary" : "bg-slate-300", disabled && "opacity-50")}><span className={cn("absolute top-1 size-4 rounded-full bg-white shadow-sm transition-all", checked ? "left-6" : "left-1")} /></button>;
}
