import { describe, expect, it } from "vitest";
import { ENGINE_HELP } from "./extension-panel";

describe("extension engine help", () => {
  it("explains how Product Hunt threads pick their forum, Self-Promotion by default", () => {
    expect(ENGINE_HELP.producthunt.placeholder).toBe("https://www.producthunt.com/p/new");
    expect(ENGINE_HELP.producthunt.help).toContain("Search for a product");
    expect(ENGINE_HELP.producthunt.help).toContain("để trống là Self-Promotion");
  });
});
