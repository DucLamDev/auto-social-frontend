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
  fields: CredentialField[];
}

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
    description: "Webhook URL chính thức của channel. URL được lưu mã hóa và không được đọc lại.",
    fields: [{ key: "webhookUrl", label: "Webhook URL", storage: "credential", type: "password", required: true, placeholder: "https://discord.com/api/webhooks/…" }],
  },
  discourse: {
    slug: "discourse",
    title: "Discourse",
    description: "API key do quản trị viên Discourse cấp, có quyền tạo topic bằng API. Không dùng cookie hoặc mật khẩu đăng nhập diễn đàn.",
    fields: [
      { key: "baseUrl", label: "Forum URL", storage: "setting", type: "url", required: true, placeholder: "https://community.example.com" },
      { key: "apiUsername", label: "API Username", storage: "setting", type: "text", required: true, placeholder: "publisher-bot" },
      { key: "apiKey", label: "API Key", storage: "credential", type: "password", required: true },
      { key: "categoryId", label: "Category ID", storage: "setting", type: "text", required: true, placeholder: "12", help: "ID số của category mặc định nhận topic mới." },
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
    description: "Instagram Login access token và Instagram User ID; MVP hỗ trợ một ảnh.",
    fields: [
      { key: "accessToken", label: "Access token", storage: "credential", type: "password", required: true },
      { key: "userId", label: "Instagram User ID", storage: "credential", type: "text", required: true },
      { key: "apiVersion", label: "Graph API version", storage: "setting", type: "text", defaultValue: "v24.0", required: true, placeholder: "v24.0" },
    ],
  },
  threads: {
    slug: "threads",
    title: "Threads",
    description: "Threads access token và Threads User ID.",
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
};

export function getCredentialConfig(slug?: string | null) {
  return slug ? credentialConnectorConfigs[slug] : undefined;
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
  if (!Object.keys(credential).length) throw new Error("Cần nhập ít nhất một credential.");
  return { credential, settings };
}
