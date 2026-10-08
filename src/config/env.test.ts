import { describe, expect, it } from "vitest";
import {
  normalizeDefaultDiscourseCategoryId,
  normalizeDefaultDiscourseUrl,
  normalizeDefaultDiscourseUsername,
} from "./env";

describe("normalizeDefaultDiscourseUrl", () => {
  it("normalizes a safe HTTPS forum URL", () => {
    expect(normalizeDefaultDiscourseUrl(" https://vpsttt.discourse.diy/ ")).toBe("https://vpsttt.discourse.diy");
    expect(normalizeDefaultDiscourseUrl("https://forums.example.com/community/"))
      .toBe("https://forums.example.com/community");
  });

  it.each([
    undefined,
    "",
    "http://vpsttt.discourse.diy",
    "https://admin:secret@vpsttt.discourse.diy",
    "https://vpsttt.discourse.diy?api_key=secret",
    "https://vpsttt.discourse.diy/#secret",
    "not-a-url",
  ])("does not expose an unsafe or invalid default: %s", (value) => {
    expect(normalizeDefaultDiscourseUrl(value)).toBeUndefined();
  });

  it("normalizes conservative public username and category defaults", () => {
    expect(normalizeDefaultDiscourseUsername(" Lam_Ho ")).toBe("Lam_Ho");
    expect(normalizeDefaultDiscourseCategoryId(" 4 ")).toBe("4");
  });

  it.each(["", "with spaces", "user@example.com", "<script>", "a".repeat(101)])(
    "rejects an unsafe default username: %s",
    (value) => expect(normalizeDefaultDiscourseUsername(value)).toBeUndefined(),
  );

  it.each(["", "0", "-1", "1.5", "04", "1e3", "9007199254740992"])(
    "rejects an invalid default category ID: %s",
    (value) => expect(normalizeDefaultDiscourseCategoryId(value)).toBeUndefined(),
  );
});
