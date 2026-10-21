import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountHealth } from "@/services/resources.service";
import { AttentionPanel } from "./attention-panel";

const state = vi.hoisted(() => ({ data: undefined as AccountHealth | undefined }));

vi.mock("@/hooks/use-resources", () => ({
  useAccountHealth: () => ({ data: state.data, isPending: !state.data, isError: false, error: null, refetch: vi.fn() }),
}));

const empty: AccountHealth = {
  total: 0,
  accounts: { problems: [], expiringSoon: [] },
  jobs: { needsAction: 0, failed: 0, possibleDuplicate: 0, retrying: 0 },
  alertsEnabled: false,
  generatedAt: "2026-10-21T00:00:00.000Z",
};

describe("AttentionPanel", () => {
  beforeEach(() => { state.data = undefined; });

  it("confirms everything is healthy", () => {
    state.data = empty;
    render(<AttentionPanel />);
    expect(screen.getByText("Ổn định")).toBeInTheDocument();
    expect(screen.getByText(/Chưa cấu hình ALERT_WEBHOOK_URL/)).toBeInTheDocument();
  });

  it("lists accounts to reconnect and stuck posts", () => {
    state.data = {
      ...empty,
      total: 3,
      alertsEnabled: true,
      accounts: {
        problems: [{ id: "a", name: "@shop", status: "RECONNECT_REQUIRED", platform: "instagram", platformName: "Instagram", expiresAt: null, autoRefresh: true }],
        expiringSoon: [],
      },
      jobs: { needsAction: 2, failed: 0, possibleDuplicate: 0, retrying: 0 },
    };
    render(<AttentionPanel />);
    expect(screen.getByText("3 việc")).toBeInTheDocument();
    expect(screen.getByText("Instagram · @shop")).toBeInTheDocument();
    expect(screen.getByText("Bài cần thao tác")).toBeInTheDocument();
    expect(screen.queryByText("Bài thất bại")).not.toBeInTheDocument();
  });
});
