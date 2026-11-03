import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VariantPreview } from "@/services/resources.service";
import { PostBody, PostPreview, previewLayout } from "./post-preview";

const base: VariantPreview = { title: "", body: "", format: "plain", tags: [], group: "SOCIAL", engine: null, maxChars: null, length: 0, overLimit: false };

describe("post preview", () => {
  it("shows each destination on the kind of page it really uses", () => {
    expect(previewLayout("mastodon", { group: "SOCIAL", engine: "mastodon" })).toBe("microblog");
    expect(previewLayout("pixelfed-social", { group: "MEDIA", engine: "pixelfed" })).toBe("photo");
    expect(previewLayout("stack-overflow", { group: "DEVELOPER", engine: "stackexchange" })).toBe("qa");
    expect(previewLayout("nginx-community", { group: "FORUM", engine: "discourse" })).toBe("forum");
    expect(previewLayout("devto", { group: "DEVELOPER", engine: "devto" })).toBe("article");
    expect(previewLayout("medium", { group: "BLOGGING", engine: "medium" })).toBe("article");
  });

  it("renders Markdown as headings, lists, code and safe links, never as HTML from the post", () => {
    const { container } = render(<PostBody format="markdown" accent="#4f46e5" text={"## Setup\n\nRun **fast** `curl`.\n\n- one\n- two\n\n```\nls -la\n```\n\n[docs](https://example.test/docs) [bad](javascript:alert(1)) <script>alert(1)</script>"} />);
    expect(screen.getByText("Setup")).toHaveClass("font-bold");
    expect(screen.getByText("fast").tagName).toBe("STRONG");
    expect(screen.getByText("curl").tagName).toBe("CODE");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("ls -la").closest("pre")).not.toBeNull();
    expect(screen.getByRole("link", { name: "docs" })).toHaveAttribute("href", "https://example.test/docs");
    expect(screen.queryByRole("link", { name: "bad" })).not.toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });

  it("draws a short-form post with highlighted hashtags and the account, and a forum topic with its title and tags", () => {
    const { unmount } = render(<PostPreview slug="mastodon" platformName="Mastodon" accountName="Mastodon · vpsttt" handle="vpsttt" preview={{ ...base, body: "Fast VPS #VPS", engine: "mastodon" }} />);
    const post = screen.getByRole("article");
    expect(within(post).getByText("vpsttt")).toBeInTheDocument();
    expect(within(post).getByText("@vpsttt · vừa xong")).toBeInTheDocument();
    expect(within(post).getByText("#VPS")).toHaveClass("font-medium");
    expect(within(post).getByText("Chia sẻ lại")).toBeInTheDocument();
    unmount();
    render(<PostPreview slug="nginx-community" platformName="NGINX Community" accountName="vpsttt" preview={{ ...base, title: "Tuning NGINX", body: "Body", format: "markdown", tags: ["nginx"], group: "FORUM", engine: "discourse" }} />);
    expect(screen.getByRole("heading", { name: "Tuning NGINX" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Tag" })).getByText("nginx")).toBeInTheDocument();
  });

  it("keeps a place for the image of a photo post that is still being drawn", () => {
    render(<PostPreview slug="pixelfed-social" platformName="pixelfed.social" accountName="vpsttt" preview={{ ...base, body: "Caption", group: "MEDIA", engine: "pixelfed" }} imagePending />);
    expect(screen.getByText("Ảnh sẽ được gắn vào đây khi đăng")).toBeInTheDocument();
  });
});
