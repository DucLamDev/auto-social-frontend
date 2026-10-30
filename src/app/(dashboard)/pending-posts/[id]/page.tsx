import type { Metadata } from "next";
import { PendingPostContentView } from "@/features/publishing/pending-post-content-view";

export const metadata: Metadata = { title: "Nội dung bài chờ duyệt" };

export default async function PendingPostContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PendingPostContentView id={id} />;
}
