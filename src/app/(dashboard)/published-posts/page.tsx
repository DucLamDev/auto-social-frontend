import type { Metadata } from "next";
import { PublishedPostsView } from "@/features/published-posts/published-posts-view";

export const metadata: Metadata = { title: "Bài đã đăng" };

export default function PublishedPostsPage() { return <PublishedPostsView />; }
