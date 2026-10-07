"use client";
import type { PropsWithChildren, ReactNode } from "react";
import type { UserRole } from "@/types/domain";
import { useCurrentUser } from "@/hooks/use-auth";
export function PermissionGate({ allow, children, fallback = null }: PropsWithChildren<{ allow: UserRole[]; fallback?: ReactNode }>) { const { data } = useCurrentUser(); return data && allow.includes(data.role) ? children : fallback; }
