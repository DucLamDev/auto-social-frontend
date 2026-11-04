import type { Metadata } from "next";
import { CampaignsView } from "@/features/campaigns/campaigns-view";
export const metadata: Metadata = { title: "Chiến dịch" };
export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ automate?: string; channel?: string }> }) {
  const { automate, channel } = await searchParams;
  // "Tạo nội dung hàng loạt & đăng" on an Accounts tab preselects that tab's accounts.
  return <CampaignsView initialAutomationOpen={automate === "1"} initialChannel={channel === "api" || channel === "extension" ? channel : undefined} />;
}
