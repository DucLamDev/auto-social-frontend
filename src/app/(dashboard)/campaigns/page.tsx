import type { Metadata } from "next";
import { CampaignsView } from "@/features/campaigns/campaigns-view";
export const metadata: Metadata = { title: "Chiến dịch" };
export default function CampaignsPage() { return <CampaignsView />; }
