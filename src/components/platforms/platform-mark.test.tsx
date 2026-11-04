import { existsSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { glyphColor, platformBrand, platformLogoUrl, PlatformMark } from "./platform-mark";

describe("PlatformMark", () => {
  it("draws the brand logo for a catalogue slug", () => {
    const { container } = render(<PlatformMark slug="hugging-face" name="Hugging Face" />);
    const mark = container.querySelector("[data-platform-logo]");
    expect(mark).toHaveAttribute("data-platform-logo", "huggingface");
    expect(mark?.querySelector("svg path")?.getAttribute("d")).toBeTruthy();
    expect(mark).toHaveAttribute("aria-hidden");
  });

  it("finds the logo from the platform name when only the name is known", () => {
    expect(platformBrand("daily.dev", "daily.dev")?.slug).toBe("dailydotdev");
    expect(platformBrand(undefined, "Stack Overflow")?.slug).toBe("stackoverflow");
    expect(platformBrand("unknown-forum", "social.vivaldi.net")?.slug).toBe("vivaldi");
    expect(platformBrand("x", "X (Twitter)")?.slug).toBe("x");
  });

  it("shows the saved logo image for platforms missing from simple-icons", () => {
    const { container } = render(<PlatformMark slug="linkedin" name="LinkedIn" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/platform-logos/linkedin.png");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.textContent).toBe("");
    expect(platformLogoUrl("voz-forums", "Voz Forums")).toBe("/platform-logos/voz-forums.png");
    // Jobs and logs only know the display name.
    expect(platformLogoUrl(undefined, "Tinhte.vn")).toBe("/platform-logos/tinhte.png");
    expect(platformLogoUrl(undefined, "DirectAdmin Forums")).toBe("/platform-logos/directadmin-forums.png");
    expect(platformLogoUrl("hugging-face", "Hugging Face")).toBeUndefined();
  });

  it("every saved logo file exists", () => {
    for (const [slug, name] of [["linkedin", "LinkedIn"], ["aws-community", "AWS Community"], ["tinhte", "Tinhte.vn"], ["voz-forums", "Voz Forums"], ["discuit", "discuit.org"], ["dzone", "DZone"], ["differ", "Differ"], ["level1techs-forum", "Level1Techs Forum"], ["scoop-it", "Scoop.it"], ["directadmin-forums", "DirectAdmin Forums"], ["warrior-forum", "Warrior Forum"], ["eventbrite", "Eventbrite"], ["hestiacp-forum", "HestiaCP Forum"], ["aapanel-forum", "aaPanel Forum"], ["cloudpanel-forum", "CloudPanel Forum"]] as const) {
      const url = platformLogoUrl(slug, name);
      expect(url, slug).toBeDefined();
      expect(existsSync(path.join(process.cwd(), "public", url!)), url).toBe(true);
    }
  });

  it("keeps the letter mark for platforms without any logo", () => {
    const { container } = render(<PlatformMark slug="hub" name="Hub" />);
    expect(container.querySelector("[data-platform-logo]")).toBeNull();
    expect(container.textContent).toBe("H");
    expect(render(<PlatformMark slug="kubeby" name="KubeBy" />).container.textContent).toBe("K");
  });

  it("uses a dark glyph on light brand colours", () => {
    expect(glyphColor("FFD21E")).toBe("#0f172a");
    expect(glyphColor("FF4500")).toBe("#ffffff");
    expect(glyphColor("000000")).toBe("#ffffff");
  });
});
