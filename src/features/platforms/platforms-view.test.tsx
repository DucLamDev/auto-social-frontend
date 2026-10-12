import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ListParams } from "@/services/resources.service";
import type { Platform } from "@/types/domain";
import { PlatformsView } from "./platforms-view";

const mocks = vi.hoisted(() => ({
  usePlatforms: vi.fn(),
  refetchPlatforms: vi.fn(),
  refetchAccounts: vi.fn(),
  mutateAsync: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ data: { role: "ADMIN" } }),
}));

vi.mock("@/hooks/use-resources", () => ({
  useAccounts: () => ({
    data: { items: [] },
    isPending: false,
    isError: false,
    refetch: mocks.refetchAccounts,
  }),
  usePlatforms: mocks.usePlatforms,
  useResourceMutation: () => ({ isPending: false, mutateAsync: mocks.mutateAsync }),
}));

const capability = {
  text: true,
  image: false,
  video: false,
  article: true,
  delete: false,
  schedule: false,
  analytics: false,
};

const platforms: Platform[] = [
  {
    id: "platform-approved-editor",
    slug: "approved-editor",
    name: "Approved Editor",
    mode: "BROWSER_ASSISTED",
    groupKey: "BLOGGING",
    connectorKey: "browser-assisted",
    enabled: true,
    connectorStatus: "CREDENTIAL_REQUIRED",
    capabilities: capability,
    accountCount: 1,
  },
  {
    id: "platform-discourse",
    slug: "discourse",
    name: "Discourse",
    mode: "COMPATIBLE_API",
    groupKey: "FORUM",
    connectorKey: "discourse",
    enabled: true,
    connectorStatus: "READY",
    capabilities: capability,
    accountCount: 2,
  },
];

function platformQuery(params?: ListParams) {
  return {
    data: {
      items: platforms,
      meta: { page: params?.page ?? 1, limit: 12, total: 60, totalPages: 5 },
    },
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: mocks.refetchPlatforms,
  };
}

describe("PlatformsView catalog", () => {
  beforeEach(() => {
    mocks.usePlatforms.mockReset().mockImplementation(platformQuery);
    mocks.refetchPlatforms.mockReset();
    mocks.refetchAccounts.mockReset();
    mocks.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it("requests a 12-item server page and groups the returned platforms", () => {
    render(<PlatformsView />);

    expect(mocks.usePlatforms).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, limit: 12 }));
    expect(screen.getByRole("heading", { name: "Blog & xuất bản" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Diễn đàn" })).toBeInTheDocument();
    expect(screen.getByText("60 nền tảng")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    expect(mocks.usePlatforms).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, limit: 12 }));
  });

  it("forwards group, mode, support, and enabled filters and resets the page", () => {
    render(<PlatformsView />);

    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    fireEvent.change(screen.getByLabelText("Lọc nhóm nền tảng"), { target: { value: "BLOGGING" } });
    fireEvent.change(screen.getByLabelText("Lọc chế độ đăng"), { target: { value: "BROWSER_ASSISTED" } });
    fireEvent.change(screen.getByLabelText("Lọc mức hỗ trợ"), { target: { value: "CREDENTIAL_REQUIRED" } });
    fireEvent.change(screen.getByLabelText("Lọc trạng thái bật tắt"), { target: { value: "INACTIVE" } });

    expect(mocks.usePlatforms).toHaveBeenLastCalledWith(expect.objectContaining({
      page: 1,
      limit: 12,
      group: "BLOGGING",
      mode: "BROWSER_ASSISTED",
      availability: "CREDENTIAL_REQUIRED",
      enabled: false,
    }));
  });

  it("resets pagination when searching", () => {
    render(<PlatformsView />);

    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    fireEvent.change(screen.getByPlaceholderText("Tìm tên hoặc slug nền tảng…"), { target: { value: "approved" } });

    expect(mocks.usePlatforms).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: "approved" }));
  });
});
