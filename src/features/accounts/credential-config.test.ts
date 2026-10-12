import { describe, expect, it, vi } from "vitest";
import { buildCredentialPayload, credentialConnectorConfigs, getCredentialConfig, getInitialCredentialValues } from "./credential-config";

describe("credential connector configuration", () => {
  it("covers every write-only credential connector exposed in the account UI", () => {
    expect(Object.keys(credentialConnectorConfigs).sort()).toEqual([
      "bluesky", "browser-assisted", "devto", "discord", "discourse", "instagram", "manual", "mastodon", "threads", "voz-forums", "wordpress", "x",
    ]);
  });

  it("separates encrypted credentials from non-secret account settings", () => {
    const config = credentialConnectorConfigs.wordpress!;
    const result = buildCredentialPayload(config, {
      siteUrl: "https://blog.example.com/",
      username: "editor",
      applicationPassword: "secret",
      publishStatus: "draft",
    });
    expect(result).toEqual({
      credential: { siteUrl: "https://blog.example.com/", username: "editor", applicationPassword: "secret" },
      settings: { publishStatus: "draft" },
    });
  });

  it("uses connector defaults and rejects insecure endpoint URLs", () => {
    const config = credentialConnectorConfigs.devto!;
    expect(getInitialCredentialValues(config)).toEqual({ apiKey: "", baseUrl: "https://dev.to/api", publishImmediately: true });
    expect(() => buildCredentialPayload(config, { apiKey: "secret", baseUrl: "http://dev.to/api", publishImmediately: true })).toThrow("HTTPS");
  });

  it("stores only the Discord webhook URL as a secret and keeps delivery options editable", () => {
    const config = credentialConnectorConfigs.discord!;
    expect(getInitialCredentialValues(config)).toEqual({
      webhookUrl: "",
      webhookUsername: "",
      webhookAvatarUrl: "",
      threadId: "",
      createForumThread: false,
    });
    expect(buildCredentialPayload(config, {
      webhookUrl: "https://discord.com/api/webhooks/123/token",
      webhookUsername: "Social Publisher",
      webhookAvatarUrl: "https://cdn.example.com/avatar.png",
      threadId: "123456789",
      createForumThread: false,
    })).toEqual({
      credential: { webhookUrl: "https://discord.com/api/webhooks/123/token" },
      settings: {
        webhookUsername: "Social Publisher",
        webhookAvatarUrl: "https://cdn.example.com/avatar.png",
        threadId: "123456789",
        createForumThread: false,
      },
    });
  });

  it("keeps only the Discourse API key in encrypted credentials", () => {
    const config = credentialConnectorConfigs.discourse!;
    const result = buildCredentialPayload(config, {
      baseUrl: " https://community.example.com ",
      apiUsername: " publisher-bot ",
      apiKey: " discourse-secret ",
      categoryId: " 12 ",
      defaultTags: " nodejs, tutorial ",
    });

    expect(result).toEqual({
      credential: { apiKey: "discourse-secret" },
      settings: {
        baseUrl: "https://community.example.com",
        apiUsername: "publisher-bot",
        categoryId: "12",
        defaultTags: "nodejs, tutorial",
      },
    });
  });

  it("prefills only public deployment metadata for the first Discourse smoke test", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_DISCOURSE_URL", "https://vpsttt.discourse.diy");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_DISCOURSE_USERNAME", "Lam_Ho");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_DISCOURSE_CATEGORY_ID", "4");
    vi.resetModules();

    try {
      const freshModule = await import("./credential-config");
      const config = freshModule.credentialConnectorConfigs.discourse!;
      expect(freshModule.getInitialCredentialValues(config)).toEqual({
        baseUrl: "https://vpsttt.discourse.diy",
        apiUsername: "Lam_Ho",
        apiKey: "",
        categoryId: "4",
        defaultTags: "",
      });
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it("sends an empty optional setting on update so saved Discourse tags can be cleared", () => {
    const config = credentialConnectorConfigs.discourse!;
    const values = {
      baseUrl: "https://community.example.com",
      apiUsername: "publisher-bot",
      apiKey: "discourse-secret",
      categoryId: "12",
      defaultTags: "   ",
    };

    expect(buildCredentialPayload(config, values)).toEqual({
      credential: { apiKey: "discourse-secret" },
      settings: {
        baseUrl: "https://community.example.com",
        apiUsername: "publisher-bot",
        categoryId: "12",
      },
    });
    expect(buildCredentialPayload(config, values, { includeEmptySettings: true })).toEqual({
      credential: { apiKey: "discourse-secret" },
      settings: {
        baseUrl: "https://community.example.com",
        apiUsername: "publisher-bot",
        categoryId: "12",
        defaultTags: "",
      },
    });
  });

  it("preloads saved non-secret settings without exposing credentials", () => {
    const config = credentialConnectorConfigs.discourse!;
    expect(getInitialCredentialValues(config, {
      baseUrl: "https://forum.example.com",
      apiUsername: "publisher",
      categoryId: 7,
      defaultTags: "guides",
    })).toEqual({
      baseUrl: "https://forum.example.com",
      apiUsername: "publisher",
      apiKey: "",
      categoryId: "7",
      defaultTags: "guides",
    });
  });

  it("serializes API-created Discourse tag arrays for safe editing", () => {
    const config = credentialConnectorConfigs.discourse!;
    expect(getInitialCredentialValues(config, {
      baseUrl: "https://forum.example.com",
      apiUsername: "publisher",
      categoryId: 7,
      defaultTags: ["guides", "nodejs"],
    })).toEqual({
      baseUrl: "https://forum.example.com",
      apiUsername: "publisher",
      apiKey: "",
      categoryId: "7",
      defaultTags: "guides, nodejs",
    });
  });

  it("reuses a connector form while applying platform-specific public defaults", () => {
    const discourse = getCredentialConfig({
      slug: "nginx-community",
      name: "NGINX Community",
      connectorKey: "discourse",
      mode: "COMPATIBLE_API",
      defaultSettings: { baseUrl: "https://community.nginx.org" },
    });
    const mastodon = getCredentialConfig({
      slug: "vivaldi-social",
      name: "social.vivaldi.net",
      connectorKey: "mastodon",
      mode: "COMPATIBLE_API",
      defaultSettings: { instanceUrl: "https://social.vivaldi.net", visibility: "unlisted" },
    });

    expect(discourse?.slug).toBe("nginx-community");
    expect(discourse && getInitialCredentialValues(discourse)).toEqual(expect.objectContaining({
      baseUrl: "https://community.nginx.org",
      apiKey: "",
    }));
    expect(mastodon && getInitialCredentialValues(mastodon)).toEqual(expect.objectContaining({
      instanceUrl: "https://social.vivaldi.net",
      visibility: "unlisted",
      accessToken: "",
    }));
  });

  it("builds a manual destination using settings only and no fake credential", () => {
    const config = getCredentialConfig({
      slug: "medium",
      name: "Medium",
      connectorKey: "manual",
      mode: "MANUAL",
      defaultSettings: { manualUrl: "https://medium.com/new-story" },
    });
    expect(config).toBeDefined();
    expect(config && getInitialCredentialValues(config)).toEqual({ manualUrl: "https://medium.com/new-story" });
    expect(config && buildCredentialPayload(config, { manualUrl: "https://medium.com/new-story" })).toEqual({
      credential: {},
      settings: { manualUrl: "https://medium.com/new-story" },
    });
  });

  it("creates browser-assisted settings without collecting a password or cookie in the form", () => {
    const config = getCredentialConfig({
      slug: "approved-editor",
      name: "Approved editor",
      connectorKey: "browser-assisted",
      mode: "BROWSER_ASSISTED",
      defaultSettings: { browserRecipe: "approved-editor", browserAutoSubmit: true },
    });
    expect(config?.browserAssisted).toBe(true);
    expect(config && getInitialCredentialValues(config)).toEqual({ browserAutoSubmit: true });
    expect(config && buildCredentialPayload(config, { browserAutoSubmit: true })).toEqual({
      credential: {},
      settings: { browserAutoSubmit: true },
    });
  });

  it("uses reviewed per-site XenForo settings and keeps final submission opt-in", () => {
    const config = getCredentialConfig({
      slug: "voz-forums",
      name: "Voz Forums",
      connectorKey: "browser-assisted",
      mode: "BROWSER_ASSISTED",
      defaultSettings: {
        browserRecipe: "voz-xenforo",
        forumPath: "",
        threadPrefixId: "",
        browserAutoSubmit: false,
        automationPermissionAttested: false,
      },
    });

    expect(config?.slug).toBe("voz-forums");
    expect(config && getInitialCredentialValues(config)).toEqual({
      forumPath: "",
      threadPrefixId: "",
      automationPermissionAttested: false,
      browserAutoSubmit: false,
    });
    expect(config && buildCredentialPayload(config, {
      forumPath: "/f/chuyen-tro-linh-tinh.17",
      threadPrefixId: "2",
      automationPermissionAttested: true,
      browserAutoSubmit: true,
    })).toEqual({
      credential: {},
      settings: {
        forumPath: "/f/chuyen-tro-linh-tinh.17",
        threadPrefixId: "2",
        automationPermissionAttested: true,
        browserAutoSubmit: true,
      },
    });
  });
});
