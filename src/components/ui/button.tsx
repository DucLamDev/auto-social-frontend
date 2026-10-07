import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:pointer-events-none disabled:opacity-50",
  { variants: {
    variant: {
      primary: "bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary-hover hover:-translate-y-px",
      secondary: "border border-border bg-white text-foreground hover:border-slate-300 hover:bg-slate-50",
      ghost: "text-slate-600 hover:bg-slate-100 hover:text-foreground",
      danger: "bg-red-50 text-danger hover:bg-red-100",
      dark: "bg-sidebar text-white hover:bg-slate-800",
    },
    size: { sm: "h-9 px-3", md: "h-10 px-4", lg: "h-12 px-5 text-[15px]", icon: "size-10 p-0" },
  }, defaultVariants: { variant: "primary", size: "md" } },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { loading?: boolean; }
export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>{loading && <LoaderCircle className="size-4 animate-spin" />}{children}</button>;
}
