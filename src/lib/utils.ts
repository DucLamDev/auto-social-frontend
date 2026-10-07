import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(value?: string | Date | null, pattern = "dd/MM/yyyy HH:mm") {
  if (!value) return "—"; const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : format(date, pattern, { locale: vi });
}
export function fromNow(value?: string | Date | null) {
  if (!value) return "—"; const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : formatDistanceToNow(date, { addSuffix: true, locale: vi });
}
export function initials(name?: string | null) { if (!name) return "SP"; return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""); }
export function compactNumber(value?: number | null) { return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value ?? 0); }
export function truncate(value: string, length = 80) { return value.length > length ? `${value.slice(0, length).trim()}…` : value; }
