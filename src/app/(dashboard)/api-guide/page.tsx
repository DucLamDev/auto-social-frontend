import type { Metadata } from "next";
import { ApiGuideView } from "@/features/api-guide/api-guide-view";

export const metadata: Metadata = { title: "Hướng dẫn API" };

export default function ApiGuidePage() { return <ApiGuideView />; }
