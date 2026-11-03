"use client";

import { Bookmark, ChevronDown, ChevronUp, Heart, MessageCircle, Repeat2, Reply, Send, Share2 } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { glyphColor, platformBrand, PlatformMark } from "@/components/platforms/platform-mark";
import { cn } from "@/lib/utils";
import type { VariantPreview } from "@/services/resources.service";

export type PreviewLayout = "microblog" | "photo" | "forum" | "qa" | "article";

const PHOTO = new Set(["pixelfed-social", "instagram"]);
const QA = new Set(["stack-overflow", "server-fault", "unix-linux-stackexchange", "quora"]);
const FORUM_ENGINES = new Set(["discourse", "xenforo", "phpbb", "lemmy", "discuit", "reddit", "tinhte"]);
const MICROBLOG_ENGINES = new Set(["mastodon", "bluesky", "linkedin", "minds", "tumblr"]);

/** Which kind of page the destination shows a post on. */
export function previewLayout(slug: string, preview: Pick<VariantPreview, "group" | "engine">): PreviewLayout {
  if (PHOTO.has(slug) || preview.engine === "pixelfed") return "photo";
  if (QA.has(slug) || preview.engine === "stackexchange") return "qa";
  if (FORUM_ENGINES.has(preview.engine ?? "") || preview.group === "FORUM") return "forum";
  if (MICROBLOG_ENGINES.has(preview.engine ?? "") || preview.group === "SOCIAL" || preview.group === "COMMUNITY") return "microblog";
  return "article";
}

// ---- safe text rendering: React elements only, never HTML from the post ----
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*|__[^_\n]+__)|(\*[^*\n]+\*|_[^_\n]+_)|(\[[^\]\n]+\]\([^)\s]+\))|(https?:\/\/[^\s<>()]+)|((?:^|(?<=\s))[#@][\p{L}\p{N}_][\p{L}\p{N}_.-]*)/gu;

function safeUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.href : null; } catch { return null; }
}

function inline(text: string, markdown: boolean, accent: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const [token] = match;
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const key = `${index}-${token}`;
    if (markdown && match[1]) nodes.push(<code key={key} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em]">{token.slice(1, -1)}</code>);
    else if (markdown && match[2]) nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (markdown && match[3]) nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    else if (markdown && match[4]) {
      const [, label = "", href = ""] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token) ?? [];
      const url = safeUrl(href);
      nodes.push(url ? <a key={key} href={url} target="_blank" rel="noopener noreferrer nofollow" className="underline" style={{ color: accent }}>{label}</a> : label);
    } else if (match[5]) {
      const url = safeUrl(token);
      nodes.push(url ? <a key={key} href={url} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline" style={{ color: accent }}>{token}</a> : token);
    } else if (match[6]) nodes.push(<span key={key} className="font-medium" style={{ color: accent }}>{token}</span>);
    else nodes.push(token);
    last = index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function lines(text: string, markdown: boolean, accent: string) {
  return text.split("\n").map((line, index, all) => <Fragment key={index}>{inline(line, markdown, accent)}{index < all.length - 1 && <br />}</Fragment>);
}

/** Paragraphs, lists, headings, quotes and code blocks; anything else stays text. */
export function PostBody({ text, format, accent }: { text: string; format: VariantPreview["format"]; accent: string }) {
  if (format === "html") {
    // HTML posts (WordPress, Blogger) render in a sandbox without scripts or same-origin access.
    const document = `<!doctype html><meta charset="utf-8"><style>body{font:15px/1.65 system-ui,sans-serif;color:#0f172a;margin:0}img{max-width:100%}a{color:${accent}}</style>${text}`;
    return <iframe title="Nội dung HTML" sandbox="" srcDoc={document} className="h-80 w-full rounded-lg border border-border bg-white" />;
  }
  const markdown = format === "markdown";
  const blocks: ReactNode[] = [];
  const source = text.replace(/\r\n?/g, "\n").split("\n");
  let index = 0;
  while (index < source.length) {
    const line = source[index]!;
    if (!line.trim()) { index++; continue; }
    if (markdown && /^\s*(```|~~~)/.test(line)) {
      const code: string[] = [];
      index++;
      while (index < source.length && !/^\s*(```|~~~)/.test(source[index]!)) code.push(source[index++]!);
      index++;
      blocks.push(<pre key={blocks.length} className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[13px] leading-5 text-slate-100"><code>{code.join("\n")}</code></pre>);
      continue;
    }
    const heading = markdown ? /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line) : null;
    if (heading) {
      blocks.push(<p key={blocks.length} className={cn("font-bold", heading[1]!.length <= 2 ? "text-lg" : "text-base")}>{inline(heading[2]!, true, accent)}</p>);
      index++;
      continue;
    }
    const bullet = /^\s*(?:[-*+•])\s+/;
    const numbered = /^\s*\d+[.)]\s+/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line) && !bullet.test(line);
      const pattern = ordered ? numbered : bullet;
      const items: string[] = [];
      while (index < source.length && pattern.test(source[index]!)) items.push(source[index++]!.replace(pattern, ""));
      const List = ordered ? "ol" : "ul";
      blocks.push(<List key={blocks.length} className={cn("space-y-1 pl-5", ordered ? "list-decimal" : "list-disc")}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item, markdown, accent)}</li>)}</List>);
      continue;
    }
    if (markdown && /^\s*>/.test(line)) {
      const quote: string[] = [];
      while (index < source.length && /^\s*>/.test(source[index]!)) quote.push(source[index++]!.replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={blocks.length} className="border-l-4 border-slate-200 pl-3 text-slate-600">{lines(quote.join("\n"), true, accent)}</blockquote>);
      continue;
    }
    const paragraph: string[] = [];
    while (index < source.length && source[index]!.trim() && !(markdown && /^\s*(```|~~~|#{1,6}\s|>)/.test(source[index]!)) && !bullet.test(source[index]!) && !numbered.test(source[index]!)) paragraph.push(source[index++]!);
    blocks.push(<p key={blocks.length}>{lines(paragraph.join("\n"), markdown, accent)}</p>);
  }
  return <div className="space-y-3 break-words">{blocks}</div>;
}

// ---- page mock-ups -----------------------------------------------------------
export interface PostPreviewProps {
  slug: string;
  platformName: string;
  accountName: string;
  handle?: string | null;
  preview: VariantPreview;
  image?: { url: string; alt?: string | null } | null;
  /** The route can carry an image but none is attached yet (or it is still being drawn). */
  imagePending?: boolean;
}

function Avatar({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" }) {
  return <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full font-bold", size === "sm" ? "size-8 text-xs" : "size-10 text-sm")} style={{ backgroundColor: color, color: glyphColor(color.replace("#", "")) }}>{name.trim().slice(0, 1).toUpperCase() || "?"}</span>;
}

function Picture({ image, pending, square, label }: { image?: PostPreviewProps["image"]; pending?: boolean; square?: boolean; label: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- stored media on another origin, shown at its own size
  if (image) return <img src={image.url} alt={image.alt ?? ""} className={cn("w-full rounded-xl border border-border object-cover", square ? "aspect-square" : "aspect-video")} />;
  if (!pending) return null;
  return <div className={cn("grid w-full place-items-center rounded-xl border border-dashed border-border bg-slate-50 text-xs text-muted", square ? "aspect-square" : "aspect-video")}>{label}</div>;
}

function Tags({ tags, accent, hash = false }: { tags: string[]; accent: string; hash?: boolean }) {
  if (!tags.length) return null;
  return <ul aria-label="Tag" className="flex flex-wrap gap-1.5">{tags.map((tag) => <li key={tag} className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${accent}1a`, color: accent }}>{hash ? `#${tag}` : tag}</li>)}</ul>;
}

function Action({ icon: Icon, label }: { icon: typeof Heart; label: string }) {
  return <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Icon aria-hidden className="size-4" />{label}</span>;
}

export function PostPreview({ slug, platformName, accountName, handle, preview, image, imagePending }: PostPreviewProps) {
  const brand = platformBrand(slug, platformName);
  const accent = brand ? `#${brand.hex === "000000" || brand.hex === "0A0A0A" ? "1d4ed8" : brand.hex}` : "#4f46e5";
  const layout = previewLayout(slug, preview);
  const display = accountName.replace(new RegExp(`^${platformName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*·\\s*`, "i"), "") || accountName;
  const at = handle ? `@${handle.replace(/^@/, "")}` : `@${display.toLowerCase().replace(/\s+/g, "")}`;
  const body = <PostBody text={preview.body} format={preview.format} accent={accent} />;
  const placeholder = "Ảnh sẽ được gắn vào đây khi đăng";
  const header = <div className="flex items-center gap-3"><Avatar name={display} color={accent} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{display}</p><p className="truncate text-xs text-slate-500">{at} · vừa xong</p></div><PlatformMark slug={slug} name={platformName} size="sm" /></div>;

  if (layout === "photo") {
    return <article className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="p-3">{header}</div>
      <Picture image={image} pending={imagePending ?? true} square label={placeholder} />
      <div className="flex gap-4 px-3 pt-3"><Action icon={Heart} label="" /><Action icon={MessageCircle} label="" /><Action icon={Share2} label="" /><span className="ml-auto"><Action icon={Bookmark} label="" /></span></div>
      <div className="space-y-2 p-3 text-sm leading-6"><p className="font-bold">{display}</p>{body}</div>
    </article>;
  }
  if (layout === "microblog") {
    const actions = slug === "linkedin"
      ? [["Thích", Heart], ["Bình luận", MessageCircle], ["Đăng lại", Repeat2], ["Gửi", Send]] as const
      : [["Trả lời", Reply], ["Chia sẻ lại", Repeat2], ["Thích", Heart], ["Lưu", Bookmark]] as const;
    return <article className="mx-auto w-full max-w-xl space-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
      {header}
      {preview.title && <p className="text-base font-bold">{preview.title}</p>}
      <div className="text-[15px] leading-6 text-slate-900">{body}</div>
      <Picture image={image} pending={imagePending} label={placeholder} />
      <div className="flex justify-between border-t border-border pt-3">{actions.map(([label, icon]) => <Action key={label} icon={icon} label={label} />)}</div>
    </article>;
  }
  if (layout === "qa") {
    return <article className="w-full rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h4 className="text-lg font-semibold leading-snug" style={{ color: accent }}>{preview.title || "(Chưa có tiêu đề)"}</h4>
      <p className="mt-1 border-b border-border pb-3 text-xs text-slate-500">Hỏi vừa xong · {platformName}</p>
      <div className="mt-4 flex gap-4">
        <div aria-hidden className="flex flex-col items-center gap-1 text-slate-400"><ChevronUp className="size-6" /><span className="text-lg font-semibold text-slate-600">0</span><ChevronDown className="size-6" /></div>
        <div className="min-w-0 flex-1 space-y-4 text-[15px] leading-6">{body}<Tags tags={preview.tags} accent={accent} />
          <div className="ml-auto w-fit rounded-lg p-2 text-xs" style={{ backgroundColor: `${accent}12` }}><p className="text-slate-500">hỏi vừa xong</p><div className="mt-1 flex items-center gap-2"><Avatar name={display} color={accent} size="sm" /><span className="font-semibold" style={{ color: accent }}>{display}</span></div></div>
        </div>
      </div>
    </article>;
  }
  if (layout === "forum") {
    return <article className="w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="space-y-2 border-b border-border p-4"><p className="text-xs font-semibold" style={{ color: accent }}>{platformName}</p><h4 className="text-xl font-bold leading-snug">{preview.title || "(Chưa có tiêu đề)"}</h4><Tags tags={preview.tags} accent={accent} /></div>
      <div className="flex gap-3 p-4"><Avatar name={display} color={accent} /><div className="min-w-0 flex-1 space-y-3"><p className="text-sm"><span className="font-bold">{display}</span><span className="ml-2 text-xs text-slate-500">vừa xong</span></p><div className="text-[15px] leading-6">{body}</div><Picture image={image} pending={imagePending} label={placeholder} /></div></div>
      <div className="flex justify-end gap-4 border-t border-border px-4 py-2"><Action icon={Heart} label="Thích" /><Action icon={Reply} label="Trả lời" /></div>
    </article>;
  }
  const words = preview.body.split(/\s+/).filter(Boolean).length;
  return <article className="w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
    <Picture image={image} pending={imagePending} label={placeholder} />
    <div className="space-y-4 p-6">
      <Tags tags={preview.tags} accent={accent} hash />
      <h4 className="text-2xl font-extrabold leading-tight">{preview.title || "(Chưa có tiêu đề)"}</h4>
      <div className="flex items-center gap-3 text-sm"><Avatar name={display} color={accent} size="sm" /><span className="font-semibold">{display}</span><span className="text-slate-500">· {Math.max(1, Math.round(words / 200))} phút đọc · {platformName}</span></div>
      <div className="text-base leading-7 text-slate-800">{body}</div>
    </div>
  </article>;
}
