import type { Metadata } from "next";
import { CalendarView } from "@/features/calendar/calendar-view";
export const metadata: Metadata = { title: "Lịch xuất bản" };
export default function CalendarPage() { return <CalendarView />; }
