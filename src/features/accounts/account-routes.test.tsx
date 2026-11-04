import { describe, expect, it, vi } from "vitest";
import AccountsPage from "@/app/(dashboard)/accounts/page";
import PlatformsPage from "@/app/(dashboard)/platforms/page";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/features/accounts/accounts-view", () => ({ AccountsView: () => null }));

describe("accounts routes", () => {
  it("sends the former Platforms page to the API tab of Accounts", () => {
    PlatformsPage();
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/accounts?tab=api");
  });

  it.each([
    [{ tab: "api" }, "api"],
    [{ tab: "extension" }, "extension"],
    [{}, "extension"],
    [{ tab: "../anything" }, "extension"],
  ])("opens the tab named in the address (%o → %s)", async (searchParams, tab) => {
    const element = await AccountsPage({ searchParams: Promise.resolve(searchParams) });
    expect(element.props).toEqual({ initialTab: tab });
  });
});
