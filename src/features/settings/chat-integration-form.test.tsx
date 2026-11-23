import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/api/errors";
import { ChatIntegrationForm } from "./chat-integration-form";

const mocks = vi.hoisted(() => ({ query: vi.fn(), update: vi.fn(), test: vi.fn(), setQueryData: vi.fn(), invalidateQueries: vi.fn() }));
vi.mock("@/hooks/use-resources", () => ({ useChatIntegration: mocks.query }));
vi.mock("@/services/resources.service", () => ({ resourcesService: { updateChatIntegration: mocks.update, testChatIntegration: mocks.test } }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ setQueryData: mocks.setQueryData, invalidateQueries: mocks.invalidateQueries }) }));

const settings = {
  revision: "rev-1", configured: true, enabled: false, baseUrl: "https://chat.example.com", channelId: "11111111-1111-4111-8111-111111111111",
  botTokenConfigured: true, botTokenHint: "wtb_…a1b2", webhookSecretConfigured: true, previousWebhookSecretConfigured: true, previousWebhookSecretExpiresAt: "2026-11-24T03:00:00Z",
  webhookPath: "/api/v1/integrations/chat/events", pendingCount: 0, failedCount: 1,
  lastDelivery: { at: "2026-11-23T03:00:00Z", ok: false, kind: "NOTICE", error: "Chat từ chối khoá bot (HTTP 401)." },
};

describe("Chat integration settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockReturnValue({ data: settings });
    mocks.update.mockResolvedValue({ ...settings, revision: "rev-2", enabled: true });
    mocks.invalidateQueries.mockResolvedValue(undefined);
  });

  it("never shows saved keys, sends only what changed and keeps new keys out of the cache", async () => {
    render(<ChatIntegrationForm />);
    expect(screen.getByLabelText("Khoá bot")).toHaveValue("");
    expect(screen.getByLabelText("Khoá bot")).toHaveAttribute("type", "password");
    expect(screen.getByText(/Lỗi: Chat từ chối khoá bot/)).toBeInTheDocument();
    expect(screen.getByText(/Khoá cũ còn được nhận tới 24\/11\/2026/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lưu kết nối chat/ })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Khoá bot"), { target: { value: " wtb_new_secret_token " } });
    fireEvent.click(screen.getByRole("switch", { name: "Bật kết nối chat" }));
    fireEvent.click(screen.getByRole("button", { name: /Lưu kết nối chat/ }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ revision: "rev-1", botToken: "wtb_new_secret_token", enabled: true }));
    expect(JSON.stringify(mocks.setQueryData.mock.calls)).not.toContain("wtb_new_secret_token");
  });

  it("reports a failed test message in words, and shows the no-permission state", async () => {
    mocks.test.mockResolvedValue({ ok: false, error: "Chat từ chối yêu cầu (HTTP 403 BOT_NOT_INSTALLED)." });
    const { unmount } = render(<ChatIntegrationForm />);
    fireEvent.click(screen.getByRole("button", { name: /Gửi tin thử/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("BOT_NOT_INSTALLED"));
    unmount();
    mocks.query.mockReturnValue({ error: new ApiError("Forbidden", "FORBIDDEN", 403), isError: true });
    render(<ChatIntegrationForm />);
    expect(screen.getByText("Chỉ vai trò ADMIN xem và sửa được kết nối chat.")).toBeInTheDocument();
  });
});
