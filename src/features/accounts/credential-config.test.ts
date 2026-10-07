import { describe, expect, it } from "vitest";
import { buildCredentialPayload, credentialConnectorConfigs, getInitialCredentialValues } from "./credential-config";

describe("credential connector configuration", () => {
  it("covers every write-only credential connector exposed in the account UI", () => {
    expect(Object.keys(credentialConnectorConfigs).sort()).toEqual([
      "bluesky", "devto", "discord", "instagram", "mastodon", "threads", "wordpress", "x",
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
});
