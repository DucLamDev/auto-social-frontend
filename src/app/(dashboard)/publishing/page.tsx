import type { Metadata } from "next";
import { PublishingView } from "@/features/publishing/publishing-view";
export const metadata: Metadata = { title: "Publishing" };
export default function PublishingPage() { return <PublishingView />; }
