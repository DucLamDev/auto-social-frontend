import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlatformAccount } from "@/types/domain";
import { AutomationCampaignModal } from "./automation-campaign-modal";

const accounts: PlatformAccount[] = [
  {
    id: "account-devto",
    platformId: "platform-devto",
    platform: { id: "platform-devto", name: "dev.to", slug: "devto", mode: "OFFICIAL_API" },
    name: "DEV Production",
    username: "duclamdev",
    enabled: true,
    status: "CONNECTED",
  },
  {
    id: "account-browser-assisted",
    platformId: "platform-browser-assisted",
    platform: { id: "platform-browser-assisted", name: "Assisted forum", slug: "assisted-forum", mode: "BROWSER_ASSISTED" },
    name: "Browser-assisted destination",
    enabled: true,
    status: "CONNECTED",
  },
  {
    id: "account-manual",
    platformId: "platform-manual",
    platform: { id: "platform-manual", name: "Manual forum", slug: "manual-forum", mode: "MANUAL" },
    name: "Manual destination",
    enabled: true,
    status: "CONNECTED",
  },
  {
    id: "account-disabled",
    platformId: "platform-discourse",
    platform: { id: "platform-discourse", name: "Discourse", slug: "discourse", mode: "COMPATIBLE_API" },
    name: "Disabled forum",
    enabled: false,
    status: "CONNECTED",
  },
];

describe("AutomationCampaignModal", () => {
  it("preselects connected enabled accounts and submits the one-step AI flow", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AutomationCampaignModal
      open
      accounts={accounts}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />);

    expect(screen.getByRole("checkbox", { name: /DEV Production/ })).toBeChecked();
    expect(screen.queryByText("Disabled forum")).not.toBeInTheDocument();
    expect(screen.queryByText("Manual destination")).not.toBeInTheDocument();
    expect(screen.queryByText("Browser-assisted destination")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tên chiến dịch"), { target: { value: "Ra mắt VPS" } });
    fireEvent.change(screen.getByLabelText("Sản phẩm hoặc chiến dịch cần quảng bá"), {
      target: { value: "Quảng bá gói VPS tốc độ cao cho lập trình viên với ưu đãi tháng đầu." },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Tôi xác nhận cho phép tự động đăng bài thật/ }));
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI & đăng ngay/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      name: "Ra mắt VPS",
      accountIds: ["account-devto"],
      runMode: "NOW",
      confirmAutoPublish: true,
    }));
  });

  it("requires explicit consent before posting externally", async () => {
    const onSubmit = vi.fn();
    render(<AutomationCampaignModal
      open
      accounts={accounts}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />);

    fireEvent.change(screen.getByLabelText("Tên chiến dịch"), { target: { value: "Ra mắt VPS" } });
    fireEvent.change(screen.getByLabelText("Sản phẩm hoặc chiến dịch cần quảng bá"), {
      target: { value: "Quảng bá gói VPS tốc độ cao cho lập trình viên với ưu đãi tháng đầu." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI & đăng ngay/ }));

    expect(await screen.findByText("Bạn cần xác nhận trước khi hệ thống đăng bài thật.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
