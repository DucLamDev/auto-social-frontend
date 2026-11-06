import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Social Publisher";

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description: "Điều phối, lên lịch và theo dõi nội dung đa nền tảng.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The inline script sets data-theme before the first paint (no white flash in dark mode), hence suppressHydrationWarning.
  return <html lang="vi" data-theme="light" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
    <body><AppProviders>{children}</AppProviders></body>
  </html>;
}
