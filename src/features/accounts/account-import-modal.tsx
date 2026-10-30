"use client";

import { useState, type FormEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useExtensionDevices, useResourceMutation } from "@/hooks/use-resources";
import { resourcesService, type AccountImportResult } from "@/services/resources.service";

export function AccountImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const devices = useExtensionDevices();
  const [deviceId, setDeviceId] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<AccountImportResult>();
  const [error, setError] = useState("");
  const importAccounts = useResourceMutation(() => resourcesService.importExtensionAccounts(file!, deviceId || devices.data?.[0]?.id || "", googleEmail), ["accounts", "extension-login-checks"]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setResult(undefined);
    if (!file || file.size > 2 * 1024 * 1024) { setError("Chọn file XLSX, CSV hoặc TSV tối đa 2 MiB."); return; }
    try { setResult(await importAccounts.mutateAsync(undefined)); setFile(undefined); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể nhập file tài khoản."); }
  };
  return <Modal open={open} onClose={() => { if (!importAccounts.isPending) onClose(); }} title="Nhập file & kết nối social" description="Upload một lần. Chrome tự đăng nhập các tài khoản và bật những kênh đã cấu hình đăng bài.">
    <form onSubmit={submit} className="space-y-4">
      <div><Label htmlFor="import-device">Chrome dùng để đăng bài</Label><Select id="import-device" value={deviceId || devices.data?.[0]?.id || ""} onChange={event => setDeviceId(event.target.value)}>{!devices.data?.length && <option value="">Cần ghép nối Chrome trước</option>}{devices.data?.map(device => <option key={device.id} value={device.id}>{device.name}</option>)}</Select></div>
      <div><Label htmlFor="import-google">Google dùng chung (tùy chọn)</Label><Input id="import-google" type="email" value={googleEmail} onChange={event => setGoogleEmail(event.target.value)} placeholder="Email Google đã đăng nhập trong Chrome" /><p className="mt-1 text-xs text-muted">Áp dụng cho dòng đăng nhập Google và dòng chỉ có email, không có mật khẩu. Để trống để dùng email của từng dòng.</p></div>
      <div><Label htmlFor="import-file">File tài khoản</Label><Input id="import-file" type="file" accept=".xlsx,.csv,.tsv" onChange={event => { setFile(event.target.files?.[0]); setResult(undefined); }} /></div>
      <p className="text-xs leading-5 text-muted">Cột bắt buộc: Social Network, User hoặc Email. Cột tùy chọn: Pass, 2FA, Phương thức Login, URL Profile, URL đăng bài, Tags, Category. Với Space, publication hoặc chuyên mục, thêm URL đăng bài vào file để cấu hình cùng lúc. Mật khẩu và khóa 2FA được mã hóa; không hiển thị lại.</p>
      <a href="/templates/social-accounts.csv" download className="text-sm font-semibold text-primary underline">Tải file mẫu</a>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {result && <div role="status" className="rounded-xl bg-indigo-50 p-3 text-sm"><p>Đã nhập {result.imported} tài khoản, giao Chrome kết nối {result.queued} tài khoản.</p><ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">{result.rows.filter(row => row.issue || row.setup !== "READY").map((row, index) => <li key={index}>{row.name}: {row.issue === "ACCOUNT_BUSY" ? "đang chạy tác vụ, chưa thay cấu hình" : row.issue ? "kiểm tra thông tin dòng " + row.row : row.setup === "DESTINATION_REQUIRED" ? "cần URL đăng bài" : "chưa có luồng đăng bài cho nền tảng này"}</li>)}</ul></div>}
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={importAccounts.isPending} onClick={onClose}>Đóng</Button><Button type="submit" loading={importAccounts.isPending} disabled={!file || !devices.data?.length}><Upload className="size-4" />Nhập file & kết nối</Button></div>
    </form>
  </Modal>;
}
