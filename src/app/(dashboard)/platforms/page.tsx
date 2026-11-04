import { redirect } from "next/navigation";
// The Platforms page was folded into Accounts: every social lives there, in the
// "Đăng qua API" or "Đăng bằng tiện ích Chrome" tab.
export default function PlatformsPage() { redirect("/accounts?tab=api"); }
