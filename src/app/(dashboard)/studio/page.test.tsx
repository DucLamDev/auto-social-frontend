import { describe, expect, it, vi } from "vitest";
import StudioPage from "./page";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

describe("StudioPage without a content", () => {
  it("sends the user to the library instead of an empty Studio", () => {
    StudioPage();
    expect(redirect).toHaveBeenCalledWith("/contents");
  });
});
