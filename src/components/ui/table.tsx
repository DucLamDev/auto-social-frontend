import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function TableWrap({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("w-full overflow-x-auto", className)} {...props} />; }
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) { return <table className={cn("w-full min-w-[720px] border-collapse text-left text-sm", className)} {...props} />; }
export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) { return <th className={cn("border-b border-border bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500", className)} {...props} />; }
export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) { return <td className={cn("border-b border-border px-5 py-4 align-middle text-slate-700", className)} {...props} />; }
