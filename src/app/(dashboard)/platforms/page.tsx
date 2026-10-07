import type { Metadata } from "next";
import { PlatformsView } from "@/features/platforms/platforms-view";
export const metadata: Metadata = { title: "Nền tảng" };
export default function PlatformsPage() { return <PlatformsView />; }
