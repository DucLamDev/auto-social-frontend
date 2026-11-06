import { cn } from "@/lib/utils";

/** VPSTTT logo (public/logo_light(100x100).png); the browser tab uses the same file as `app/icon.png`. */
export const APP_LOGO_URL = "/logo_light(100x100).png";

/** The logo on a white tile (kept white in the dark theme too), so it reads on any background. `label` is set only when no app name is shown next to it. */
export function AppLogo({ className, label }: { className?: string; label?: string }) {
  return <span className={cn("grid shrink-0 place-items-center rounded-xl bg-[#fff] p-1", className)}>
    {/* eslint-disable-next-line @next/next/no-img-element -- 100px static logo, no resizing needed */}
    <img src={APP_LOGO_URL} alt={label ?? ""} width={100} height={100} className="size-full object-contain" />
  </span>;
}
