import type { Metadata } from "next";
import { CampaignsView } from "@/features/campaigns/campaigns-view";
export const metadata: Metadata = { title: "Chiến dịch" };
export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ automate?: string }> }) {
  return <CampaignsView initialAutomationOpen={(await searchParams).automate === "1"} />;
}
