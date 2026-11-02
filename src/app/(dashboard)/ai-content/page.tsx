import type { Metadata } from "next";
import { AiContentView } from "@/features/campaigns/ai-content-view";

export const metadata: Metadata = { title: "Content đợi duyệt" };
export default function AiContentPage() { return <AiContentView />; }
