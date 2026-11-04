import {
  siAlmalinux, siBlogger, siBluesky, siCaddy, siCpanel, siDailydotdev, siDailymotion, siDevdotto, siDiscord, siDiscourse,
  siDisqus, siFlipboard, siGumroad, siHuggingface, siInstagram, siLemmy, siLinuxcontainers, siLinuxfoundation, siMastodon,
  siMedium, siMewe, siMikrotik, siMinds, siMongodb, siNginx, siOpennebula, siPixelfed, siProducthunt, siQuora, siReddit,
  siRedis, siReplit, siServerfault, siSlideshare, siStackexchange, siStackoverflow, siSubstack, siThreads, siTiktok,
  siTruenas, siTumblr, siUbiquiti, siUnraid, siVivaldi, siWordpress, siX,
  type SimpleIcon,
} from "simple-icons";
import { cn } from "@/lib/utils";

/** Letters are kept for platforms without a brand logo (LinkedIn, Tinhte, Voz…). */
const colors: Record<string, string> = { instagram: "from-fuchsia-500 to-orange-400", threads: "from-slate-800 to-black", x: "from-slate-800 to-black", linkedin: "from-blue-600 to-blue-500", wordpress: "from-sky-700 to-sky-500", blogger: "from-orange-500 to-amber-400", devto: "from-slate-800 to-slate-600", discord: "from-indigo-600 to-violet-500", discourse: "from-cyan-600 to-blue-600", reddit: "from-orange-600 to-orange-400", bluesky: "from-sky-500 to-cyan-400", mastodon: "from-indigo-600 to-purple-500", tiktok: "from-slate-950 to-pink-500" };

/**
 * Keys are the platform slug or name with everything except a–z / 0–9 removed, so
 * `hugging-face`, `Hugging Face` and `hugging face` all resolve to the same logo
 * (publishing jobs and logs only know the platform name).
 */
const brands: Record<string, SimpleIcon> = {
  instagram: siInstagram, threads: siThreads, x: siX, xtwitter: siX, twitter: siX,
  wordpress: siWordpress, medium: siMedium, inplainenglish: siMedium, blogger: siBlogger, substack: siSubstack, tumblr: siTumblr,
  devto: siDevdotto, quora: siQuora, discord: siDiscord, reddit: siReddit, slideshare: siSlideshare, bluesky: siBluesky,
  mastodon: siMastodon, mastodonsocial: siMastodon, vivaldisocial: siVivaldi, socialvivaldinet: siVivaldi,
  pixelfedsocial: siPixelfed, lemmyworld: siLemmy, minds: siMinds, mewe: siMewe, dailydev: siDailydotdev,
  producthunt: siProducthunt, dailymotion: siDailymotion, stackoverflow: siStackoverflow, serverfault: siServerfault,
  unixlinuxstackexchange: siStackexchange, truenascommunity: siTruenas, unraidforums: siUnraid, flipboard: siFlipboard,
  huggingface: siHuggingface, almalinuxforum: siAlmalinux, linuxcontainersforum: siLinuxcontainers,
  linuxfoundationforum: siLinuxfoundation, disqus: siDisqus, nginxcommunity: siNginx, gumroad: siGumroad,
  caddycommunity: siCaddy, cpanelcommunity: siCpanel, mikrotikcommunity: siMikrotik, ubiquiticommunity: siUbiquiti,
  opennebulacommunity: siOpennebula, replitcommunity: siReplit, mongodbcommunity: siMongodb,
  rediscommunityforum: siRedis, tiktok: siTiktok, discourse: siDiscourse,
};

export const platformKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Brand logo for a platform slug (preferred) or display name; undefined when none is bundled. */
export function platformBrand(slug: string | undefined, name: string): SimpleIcon | undefined {
  return (slug ? brands[platformKey(slug)] : undefined) ?? brands[platformKey(name)];
}

/** Light brand colours (Hugging Face yellow, Minds, Gumroad pink) need a dark glyph to stay legible. */
export function glyphColor(hex: string) {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.4 ? "#0f172a" : "#ffffff";
}

export function PlatformMark({ slug, name, size = "md" }: { slug?: string; name: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const key = platformKey(slug || name);
  const brand = platformBrand(slug, name);
  const box = cn("grid shrink-0 place-items-center shadow-sm", size === "xs" ? "size-6 rounded-lg text-[9px]" : "rounded-xl", size === "sm" && "size-8 text-[10px]", size === "md" && "size-10 text-xs", size === "lg" && "size-12 text-sm");
  if (brand) {
    return <span aria-hidden data-platform-logo={brand.slug} className={cn(box, "ring-1 ring-inset ring-black/10")} style={{ backgroundColor: `#${brand.hex}`, color: glyphColor(brand.hex) }}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-[55%]" focusable="false"><path d={brand.path} /></svg>
    </span>;
  }
  return <span aria-hidden className={cn(box, "bg-gradient-to-br font-black text-white", colors[key] ?? "from-slate-500 to-slate-700")}>{name.slice(0, key === "wordpress" ? 2 : 1).toUpperCase()}</span>;
}
