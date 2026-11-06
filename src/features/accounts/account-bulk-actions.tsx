"use client";

import { Power, PowerOff, TestTube2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useInvalidate } from "@/hooks/use-resources";
import { resourcesService } from "@/services/resources.service";
import type { PlatformAccount } from "@/types/domain";
import { accountNames, runForEach } from "./account-bulk";
import { isChromeBound } from "./extension-account-state";
import { isExtensionAccount } from "./extension-panel";

const errorText = (error: unknown) => error instanceof Error ? error.message : "Có lỗi";
// Deleting or switching accounts changes campaigns, the publish queue and the posts list too.
const AFFECTED = ["accounts", "extension-login-checks", "campaigns", "publish-jobs", "published-posts"];

/** Same rule as the row switch: a Chrome account without a posting flow is switched on by a successful login check. */
const canSwitchOn = (account: PlatformAccount) => !isChromeBound(account) || isExtensionAccount(account);
/** Same rule as the row "Test" button: a Playwright account needs a saved session first. */
const canTest = (account: PlatformAccount) => isChromeBound(account) || isExtensionAccount(account)
  || account.platform?.mode !== "BROWSER_ASSISTED" || account.browserSessionConfigured === true;

function failureText(failed: Array<{ item: PlatformAccount; error: unknown }>) {
  return failed.slice(0, 3).map(({ item, error }) => `${item.name}: ${errorText(error)}`).join("; ")
    + (failed.length > 3 ? ` và ${failed.length - 3} tài khoản khác` : "");
}

/** Actions on the ticked rows of the accounts list. */
export function AccountBulkBar({ selected, onClear, onDelete }: { selected: PlatformAccount[]; onClear: () => void; onDelete: (accounts: PlatformAccount[]) => void }) {
  const invalidate = useInvalidate();
  const [busy, setBusy] = useState<"" | "test" | "on" | "off">("");
  const run = async (kind: "test" | "on" | "off", work: () => Promise<void>) => {
    setBusy(kind);
    try { await work(); } catch (error) { toast.error(errorText(error)); } finally {
      setBusy("");
      await invalidate(...AFFECTED);
    }
  };

  const test = () => run("test", async () => {
    const chrome = selected.filter(isChromeBound);
    const others = selected.filter((account) => !isChromeBound(account) && canTest(account));
    const skipped = selected.length - chrome.length - others.length;
    const parts: string[] = [];
    if (chrome.length) {
      // Like the bulk login check: an account whose last check succeeded is not signed in again,
      // so ticking everything cannot log every social in a second time.
      const { queued, skipped: signedIn = 0 } = await resourcesService.queueExtensionLoginChecks(chrome.map((account) => account.id), false, true, true);
      const waiting = chrome.length - queued - signedIn;
      parts.push(`Đã giao Chrome kiểm tra ${queued} tài khoản`
        + (signedIn ? `, bỏ qua ${signedIn} tài khoản đã đăng nhập thành công` : "")
        + (waiting > 0 ? `, ${waiting} tài khoản đang được kiểm tra sẵn hoặc Chrome đã gán chưa chạy` : ""));
    }
    const { ok, failed } = await runForEach(others, async (account) => {
      const result = await resourcesService.testAccount(account.id);
      if (!result.ok) throw new Error(result.message || "cần thao tác thủ công");
    });
    if (ok.length) parts.push(`${ok.length} tài khoản kết nối tốt`);
    if (skipped) parts.push(`bỏ qua ${skipped} tài khoản Playwright chưa đăng nhập`);
    if (parts.length) toast.success(`${parts.join("; ")}.`);
    if (failed.length) toast.warning(`${failed.length} tài khoản chưa kết nối được: ${failureText(failed)}`, { duration: 15_000 });
  });

  const switchTo = (enabled: boolean) => run(enabled ? "on" : "off", async () => {
    const changing = selected.filter((account) => account.enabled !== enabled);
    const targets = enabled ? changing.filter(canSwitchOn) : changing;
    const skipped = changing.length - targets.length;
    if (!targets.length) {
      toast.info(enabled
        ? skipped ? "Tài khoản Chrome chưa có luồng đăng chỉ bật được sau khi kiểm tra đăng nhập thành công." : "Các tài khoản đã chọn đều đang bật."
        : "Các tài khoản đã chọn đều đang tắt.");
      return;
    }
    const { ok, failed } = await runForEach(targets, (account) => resourcesService.updateAccount(account.id, { enabled }));
    // Like the row switch: a Chrome account that was switched on is checked straight away.
    const chromeOn = enabled ? ok.filter(isChromeBound) : [];
    if (chromeOn.length) await resourcesService.queueExtensionLoginChecks(chromeOn.map((account) => account.id), false, true);
    if (ok.length) {
      toast.success(`Đã ${enabled ? "bật" : "tắt"} ${ok.length} tài khoản`
        + (chromeOn.length ? " và giao Chrome kiểm tra kết nối" : "")
        + (skipped ? `; ${skipped} tài khoản Chrome chưa có luồng đăng chưa bật được` : "") + ".");
    }
    if (failed.length) toast.error(`${failed.length} tài khoản chưa ${enabled ? "bật" : "tắt"} được: ${failureText(failed)}`, { duration: 15_000 });
  });

  return <div role="toolbar" aria-label="Thao tác với tài khoản đã chọn" className="flex flex-wrap items-center gap-2 border-b border-border bg-indigo-50/60 px-4 py-2.5">
    <span className="text-sm font-semibold text-indigo-950">Đã chọn {selected.length} tài khoản</span>
    <div className="flex flex-wrap gap-1 sm:ml-auto">
      <Button size="sm" variant="secondary" loading={busy === "test"} disabled={Boolean(busy)} onClick={() => void test()}><TestTube2 className="size-4" />Kiểm tra</Button>
      <Button size="sm" variant="secondary" loading={busy === "on"} disabled={Boolean(busy)} onClick={() => void switchTo(true)}><Power className="size-4" />Bật</Button>
      <Button size="sm" variant="secondary" loading={busy === "off"} disabled={Boolean(busy)} onClick={() => void switchTo(false)}><PowerOff className="size-4" />Tắt</Button>
      <Button size="sm" variant="danger" disabled={Boolean(busy)} onClick={() => onDelete(selected)}><Trash2 className="size-4" />Xoá</Button>
      <Button size="sm" variant="ghost" disabled={Boolean(busy)} onClick={onClear}><X className="size-4" />Bỏ chọn</Button>
    </div>
  </div>;
}

/** Confirms and deletes accounts; accounts with a post waiting or being posted are kept by the server. */
export function DeleteAccountsDialog({ accounts, onClose, onDeleted }: { accounts: PlatformAccount[]; onClose: () => void; onDeleted: (ids: string[]) => void }) {
  const invalidate = useInvalidate();
  const [busy, setBusy] = useState(false);
  const posts = accounts.reduce((sum, account) => sum + (account.publishedCount ?? 0), 0);
  const several = accounts.length > 1;
  const confirm = async () => {
    setBusy(true);
    try {
      const result = await resourcesService.deleteAccounts(accounts.map((account) => account.id));
      // notFound: already deleted (another tab) or not yours; either way it is gone from this list.
      const gone = [...result.deleted, ...result.notFound];
      if (gone.length) toast.success(`Đã xoá ${gone.length} tài khoản.`);
      if (result.blocked.length) {
        toast.warning(`Giữ lại ${result.blocked.length} tài khoản: ${result.blocked.slice(0, 3).map((item) => `${item.name}: ${item.reason}`).join(" ")}${result.blocked.length > 3 ? ` (và ${result.blocked.length - 3} tài khoản khác)` : ""}`, { duration: 15_000 });
      }
      onDeleted(gone);
      onClose();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
      await invalidate(...AFFECTED);
    }
  };
  return <ConfirmDialog
    open={accounts.length > 0}
    title={several ? `Xoá ${accounts.length} tài khoản social` : `Xoá tài khoản “${accounts[0]?.name ?? ""}”`}
    description={`${several ? `Sẽ xoá: ${accountNames(accounts)}. ` : ""}Thông tin đăng nhập, phiên Chrome / 2FA, lịch sử kiểm tra và lịch sử đăng${posts ? ` (gồm ${posts} bài đã đăng)` : ""} của ${several ? "các tài khoản này" : "tài khoản này"} bị xoá khỏi hệ thống. Bài đã lên mạng xã hội vẫn giữ nguyên. Tài khoản đang có bài chờ đăng hoặc đang đăng sẽ được giữ lại. Không hoàn tác được.`}
    confirmLabel="Xoá vĩnh viễn"
    busy={busy}
    danger
    onClose={onClose}
    onConfirm={confirm}
  />;
}
