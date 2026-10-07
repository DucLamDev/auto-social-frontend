import type { Metadata } from "next";
import { StudioView } from "@/features/studio/studio-view";
export const metadata: Metadata = { title: "Content Studio" };
export default async function StudioDetailPage({ params }: { params: Promise<{ contentId: string }> }) { const { contentId } = await params; return <StudioView contentId={contentId} />; }
