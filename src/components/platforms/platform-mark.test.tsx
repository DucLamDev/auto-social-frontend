import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { glyphColor, platformBrand, PlatformMark } from "./platform-mark";

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

  it("keeps the letter mark for platforms without a bundled logo", () => {
    const { container } = render(<PlatformMark slug="linkedin" name="LinkedIn" />);
    expect(container.querySelector("[data-platform-logo]")).toBeNull();
    expect(container.textContent).toBe("L");
    expect(render(<PlatformMark slug="voz-forums" name="Voz Forums" />).container.textContent).toBe("V");
  });

  it("uses a dark glyph on light brand colours", () => {
    expect(glyphColor("FFD21E")).toBe("#0f172a");
    expect(glyphColor("FF4500")).toBe("#ffffff");
    expect(glyphColor("000000")).toBe("#ffffff");
  });
});
