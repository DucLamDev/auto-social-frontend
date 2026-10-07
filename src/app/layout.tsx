import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Social Publisher";

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description: "Điều phối, lên lịch và theo dõi nội dung đa nền tảng.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" suppressHydrationWarning><body><AppProviders>{children}</AppProviders></body></html>;
}
