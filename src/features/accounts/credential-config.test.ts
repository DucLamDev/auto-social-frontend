import { describe, expect, it } from "vitest";
import { buildCredentialPayload, credentialConnectorConfigs, getInitialCredentialValues } from "./credential-config";

describe("credential connector configuration", () => {
  it("covers every write-only credential connector exposed in the account UI", () => {
    expect(Object.keys(credentialConnectorConfigs).sort()).toEqual([
      "bluesky", "devto", "discord", "discourse", "instagram", "mastodon", "threads", "wordpress", "x",
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
});
