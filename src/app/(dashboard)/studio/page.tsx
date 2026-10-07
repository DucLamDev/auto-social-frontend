import type { Metadata } from "next";
import { StudioView } from "@/features/studio/studio-view";
export const metadata: Metadata = { title: "Content Studio" };
export default function StudioPage() { return <StudioView />; }
