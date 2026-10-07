import type { Metadata } from "next";
import { PromptsView } from "@/features/prompts/prompts-view";
export const metadata: Metadata = { title: "Prompt templates" };
export default function PromptsPage() { return <PromptsView />; }
