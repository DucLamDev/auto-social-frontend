import type { Metadata } from "next";
import { LogsView } from "@/features/logs/logs-view";
export const metadata: Metadata = { title: "Nhật ký" };
export default function LogsPage() { return <LogsView />; }
