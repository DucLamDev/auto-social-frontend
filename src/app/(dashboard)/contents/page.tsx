import type { Metadata } from "next";
import { ContentsView } from "@/features/contents/contents-view";
export const metadata: Metadata = { title: "Nội dung" };
export default async function ContentsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search = "" } = await searchParams;
  return <ContentsView initialSearch={search} />;
}
