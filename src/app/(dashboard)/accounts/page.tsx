import type { Metadata } from "next";
import { AccountsView } from "@/features/accounts/accounts-view";
export const metadata: Metadata = { title: "Tài khoản" };
export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  return <AccountsView initialTab={(await searchParams).tab === "api" ? "api" : "extension"} />;
}
