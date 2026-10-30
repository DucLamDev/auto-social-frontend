import type { Metadata } from "next";
import { PublishingView } from "@/features/publishing/publishing-view";

export const metadata: Metadata = { title: "Bài chờ duyệt" };

export default function PendingPostsPage() { return <PublishingView moderationOnly />; }
