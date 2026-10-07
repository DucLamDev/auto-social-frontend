import type { Metadata } from "next";
import { SourcesView } from "@/features/sources/sources-view";
export const metadata: Metadata = { title: "Nguồn nội dung" };
export default function SourcesPage() { return <SourcesView />; }
