import { env } from "@/config/env";
import type { ConnectorMode, Platform } from "@/types/domain";

export type CredentialValue = string | boolean;

export interface CredentialField {
  key: string;
  label: string;
  storage: "credential" | "setting";
  type: "text" | "password" | "url" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  help?: string;
  defaultValue?: CredentialValue;
  options?: Array<{ value: string; label: string }>;
}

export interface CredentialConnectorConfig {
  slug: string;
  title: string;
  description: string;
  requiresCredential?: boolean;
  browserAssisted?: boolean;
  fields: CredentialField[];
}

type CredentialConfigTarget = {
  slug: string;
  name?: string;
  connectorKey?: string;
  mode?: ConnectorMode;
  defaultSettings?: Record<string, unknown>;
};

interface BuildCredentialPayloadOptions {
  includeSettings?: boolean;
  includeEmptySettings?: boolean;
}

export const credentialConnectorConfigs: Record<string, CredentialConnectorConfig> = {
  wordpress: {
    slug: "wordpress",
    title: "WordPress",
    description: "Application Password của WordPress; không dùng mật khẩu đăng nhập chính.",
    fields: [
      { key: "siteUrl", label: "Site URL", storage: "credential", type: "url", required: true, placeholder: "https://blog.example.com" },
      { key: "username", label: "Username", storage: "credential", type: "text", required: true },
      { key: "applicationPassword", label: "Application Password", storage: "credential", type: "password", required: true },
      { key: "publishStatus", label: "Trạng thái bài mặc định", storage: "setting", type: "select", defaultValue: "publish", options: [{ value: "publish", label: "Publish" }, { value: "draft", label: "Draft" }, { value: "pending", label: "Pending review" }, { value: "private", label: "Private" }] },
    ],
  },
  devto: {
    slug: "devto",
    title: "dev.to",
    description: "API key lấy trong DEV Community Settings → Extensions.",
    fields: [
      { key: "apiKey", label: "DEV API key", storage: "credential", type: "password", required: true },
      { key: "baseUrl", label: "Forem API URL", storage: "setting", type: "url", defaultValue: "https://dev.to/api", required: true },
      { key: "publishImmediately", label: "Publish ngay", storage: "setting", type: "checkbox", defaultValue: true, help: "Tắt để tạo draft và chuyển job sang NEEDS_ACTION." },
    ],
  },
  discord: {
    slug: "discord",
    title: "Discord",
    description: "Incoming Webhook của channel Discord. Tạo tại Server Settings → Integrations → Webhooks; URL được lưu mã hóa.",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", storage: "credential", type: "password", required: true, placeholder: "https://discord.com/api/webhooks/…", help: "Dán URL từ nút Copy Webhook URL. Trang tài liệu Discord không chứa URL/token của server của bạn." },
      { key: "webhookUsername", label: "Tên webhook khi đăng", storage: "setting", type: "text", placeholder: "Social Publisher", help: "Tùy chọn; ghi đè tên hiển thị của webhook cho các bài từ destination này." },
      { key: "webhookAvatarUrl", label: "Avatar URL", storage: "setting", type: "url", placeholder: "https://cdn.example.com/bot-avatar.png", help: "Tùy chọn; phải là URL HTTPS công khai." },
      { key: "threadId", label: "Thread ID có sẵn", storage: "setting", type: "text", placeholder: "123456789012345678", help: "Tùy chọn. Dùng cho webhook gửi vào một thread có sẵn; bật Developer Mode rồi Copy ID của thread." },
      { key: "createForumThread", label: "Tự tạo thread cho Forum/Media channel", storage: "setting", type: "checkbox", defaultValue: false, help: "Dùng tiêu đề bài làm tên thread. Không bật cùng lúc với Thread ID có sẵn." },
    ],
  },
  discourse: {
    slug: "discourse",
    title: "Discourse",
    description: "API key do quản trị viên Discourse cấp, có quyền tạo topic bằng API. Không dùng cookie hoặc mật khẩu đăng nhập diễn đàn.",
    fields: [
      { key: "baseUrl", label: "Forum URL", storage: "setting", type: "url", required: true, defaultValue: env.defaultDiscourseUrl, placeholder: "https://community.example.com", help: "Phải là HTTPS. Có thể đặt URL mặc định lúc build bằng NEXT_PUBLIC_DEFAULT_DISCOURSE_URL; API key không được lưu trong biến public." },
      { key: "apiUsername", label: "API Username", storage: "setting", type: "text", required: true, defaultValue: env.defaultDiscourseUsername, placeholder: "publisher-bot", help: "Username chính xác được gắn với API key. Mặc định public chỉ dành cho smoke test; production nên dùng publisher-bot quyền tối thiểu." },
      { key: "apiKey", label: "API Key", storage: "credential", type: "password", required: true },
      { key: "categoryId", label: "Category ID", storage: "setting", type: "text", required: true, defaultValue: env.defaultDiscourseCategoryId, placeholder: "12", help: "ID số của category mặc định nhận topic mới. Mặc định public chỉ dành cho smoke test; production nên dùng category staging hoặc category đích đã duyệt." },
      { key: "defaultTags", label: "Tags mặc định", storage: "setting", type: "text", placeholder: "nodejs, tutorial", help: "Không bắt buộc. Chỉ nhập tag đã tồn tại và được phép trên forum; phân tách bằng dấu phẩy." },
    ],
  },
  bluesky: {
    slug: "bluesky",
    title: "Bluesky",
    description: "Dùng access JWT và DID của tài khoản AT Protocol.",
    fields: [
      { key: "accessJwt", label: "Access JWT", storage: "credential", type: "password", required: true },
      { key: "did", label: "DID", storage: "credential", type: "text", required: true, placeholder: "did:plc:…" },
      { key: "serviceUrl", label: "PDS service URL", storage: "credential", type: "url", defaultValue: "https://bsky.social", required: true },
    ],
  },
  mastodon: {
    slug: "mastodon",
    title: "Mastodon",
    description: "Personal access token và URL instance của tài khoản.",
    fields: [
      { key: "instanceUrl", label: "Instance URL", storage: "credential", type: "url", required: true, placeholder: "https://mastodon.social" },
      { key: "accessToken", label: "Access token", storage: "credential", type: "password", required: true },
      { key: "visibility", label: "Visibility", storage: "setting", type: "select", defaultValue: "public", options: [{ value: "public", label: "Public" }, { value: "unlisted", label: "Unlisted" }, { value: "private", label: "Followers only" }, { value: "direct", label: "Direct" }] },
    ],
  },
  instagram: {
    slug: "instagram",
    title: "Instagram",
    description: "Nên dùng nút Kết nối Instagram ở mục Đăng nhập một lần để token tự gia hạn. Form này chỉ cho token dán tay (hết hạn sau 60 ngày, không tự gia hạn); hỗ trợ một ảnh mỗi bài.",
    fields: [
      { key: "accessToken", label: "Access token", storage: "credential", type: "password", required: true },
      { key: "userId", label: "Instagram User ID", storage: "credential", type: "text", required: true },
      { key: "apiVersion", label: "Graph API version", storage: "setting", type: "text", defaultValue: "v24.0", required: true, placeholder: "v24.0" },
    ],
  },
  threads: {
    slug: "threads",
    title: "Threads",
    description: "Nên dùng nút Kết nối Threads ở mục Đăng nhập một lần để token tự gia hạn. Form này chỉ cho token dán tay (hết hạn sau 60 ngày, không tự gia hạn).",
    fields: [
      { key: "accessToken", label: "Access token", storage: "credential", type: "password", required: true },
      { key: "userId", label: "Threads User ID", storage: "credential", type: "text", required: true },
      { key: "apiVersion", label: "Threads API version", storage: "setting", type: "text", defaultValue: "v1.0", required: true, placeholder: "v1.0" },
    ],
  },
  x: {
    slug: "x",
    title: "X",
    description: "User access token có quyền đọc người dùng và tạo/xóa post.",
    fields: [{ key: "accessToken", label: "User access token", storage: "credential", type: "password", required: true }],
  },
  "voz-forums": {
    slug: "voz-forums",
    title: "Voz Forums · Playwright",
    description: "Adapter XenForo cố định cho voz.vn. Hệ thống không nhận mật khẩu; bạn đăng nhập trong Chromium helper và session được lưu mã hóa.",
    requiresCredential: false,
    browserAssisted: true,
    fields: [
      { key: "forumPath", label: "Đường dẫn box VOZ", storage: "setting", type: "text", required: true, placeholder: "/f/ten-box.123", help: "Chỉ nhập pathname của box lấy từ URL voz.vn; không có box mặc định vì mỗi box có nội quy riêng. Adapter khóa hostname và tự thêm /post-thread." },
      { key: "threadPrefixId", label: "Thread Prefix ID", storage: "setting", type: "text", placeholder: "1", help: "Chỉ cần khi box bắt buộc chọn tiền tố. Nếu bỏ trống mà giao diện yêu cầu prefix, worker sẽ dừng an toàn." },
      { key: "automationPermissionAttested", label: "Tôi xác nhận tài khoản và quản trị viên/điều khoản VOZ cho phép automation", storage: "setting", type: "checkbox", defaultValue: false, help: "Bắt buộc trước khi worker được phép bấm nút đăng. Không thay thế nội quy riêng của từng box." },
      { key: "browserAutoSubmit", label: "Cho phép tự bấm nút đăng cuối cùng", storage: "setting", type: "checkbox", defaultValue: false, help: "Nếu tắt, hệ thống chỉ chuẩn bị nội dung rồi trả về NEEDS_ACTION." },
    ],
  },
  "browser-assisted": {
    slug: "browser-assisted",
    title: "Playwright browser automation",
    description: "Tạo account trước, sau đó chạy helper đăng nhập cục bộ. Hệ thống chỉ lưu session đã mã hóa; không nhận hoặc lưu mật khẩu, mã OTP hay CAPTCHA.",
    requiresCredential: false,
    browserAssisted: true,
    fields: [
      { key: "browserAutoSubmit", label: "Tự bấm nút đăng cuối cùng khi nền tảng cho phép", storage: "setting", type: "checkbox", defaultValue: false, help: "Chỉ áp dụng cho adapter đã được duyệt chính sách. Backend vẫn buộc dừng khi nền tảng yêu cầu người dùng xác nhận." },
    ],
  },
  manual: {
    slug: "manual",
    title: "Kênh thủ công",
    description: "Hệ thống tạo sẵn nội dung và ảnh; bạn mở trang đích để kiểm tra, đăng và xác nhận hoàn tất.",
    requiresCredential: false,
    fields: [
      { key: "manualUrl", label: "Trang tạo bài", storage: "setting", type: "url", required: true, placeholder: "https://community.example.com/new-topic", help: "Không phải secret. Hệ thống dùng URL này cho nút mở trang ở bước bàn giao thủ công." },
    ],
  },
};

function asDefaultValue(value: unknown): CredentialValue | undefined {
  if (typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

export function getCredentialConfig(target?: string | CredentialConfigTarget | Pick<Platform, "slug" | "name" | "connectorKey" | "mode" | "defaultSettings"> | null) {
  if (!target) return undefined;
  const descriptor: CredentialConfigTarget = typeof target === "string" ? { slug: target } : target;
  const connectorKey = descriptor.connectorKey ?? (descriptor.mode === "MANUAL" ? "manual" : descriptor.slug);
  const base = credentialConnectorConfigs[descriptor.slug] ?? credentialConnectorConfigs[connectorKey];
  if (!base) return undefined;
  const defaults = descriptor.defaultSettings ?? {};
  return {
    ...base,
    slug: descriptor.slug,
    title: descriptor.name ?? base.title,
    fields: base.fields.map((field) => ({
      ...field,
      defaultValue: asDefaultValue(defaults[field.key]) ?? field.defaultValue,
    })),
  };
}

export function getInitialCredentialValues(config: CredentialConnectorConfig, settings?: Record<string, unknown>) {
  return Object.fromEntries(config.fields.map((field) => {
    const saved = field.storage === "setting" ? settings?.[field.key] : undefined;
    const savedValue = typeof saved === "boolean"
      ? saved
      : typeof saved === "string" || typeof saved === "number"
        ? String(saved)
        : Array.isArray(saved) && saved.every((item) => typeof item === "string")
          ? saved.join(", ")
        : undefined;
    return [field.key, savedValue ?? field.defaultValue ?? (field.type === "checkbox" ? false : "")];
  })) as Record<string, CredentialValue>;
}

export function buildCredentialPayload(
  config: CredentialConnectorConfig,
  values: Record<string, CredentialValue>,
  options: boolean | BuildCredentialPayloadOptions = {},
) {
  const includeSettings = typeof options === "boolean" ? options : options.includeSettings ?? true;
  const includeEmptySettings = typeof options === "boolean" ? false : options.includeEmptySettings ?? false;
  const credential: Record<string, unknown> = {};
  const settings: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (!includeSettings && field.storage === "setting") continue;
    const raw = values[field.key];
    const value = typeof raw === "string" ? raw.trim() : raw;
    if (field.required && (value === "" || value === undefined)) throw new Error(`${field.label} là bắt buộc.`);
    if (value === "" || value === undefined) {
      if (field.storage === "setting" && value === "" && includeEmptySettings) settings[field.key] = "";
      continue;
    }
    if (field.type === "url") {
      let url: URL;
      try { url = new URL(String(value)); } catch { throw new Error(`${field.label} phải là URL hợp lệ.`); }
      if (url.protocol !== "https:") throw new Error(`${field.label} phải dùng HTTPS.`);
    }
    (field.storage === "credential" ? credential : settings)[field.key] = value;
  }
  if (config.requiresCredential !== false && !Object.keys(credential).length) throw new Error("Cần nhập ít nhất một credential.");
  return { credential, settings };
}
