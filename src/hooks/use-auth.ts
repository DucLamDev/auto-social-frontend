"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { LoginInput } from "@/schemas/auth";
export const authKeys = { me: ["auth", "me"] as const };
export function useCurrentUser() { return useQuery({ queryKey: authKeys.me, queryFn: authService.me, staleTime: 60_000 }); }
export function useLogin() { const client = useQueryClient(); return useMutation({ mutationFn: (input: LoginInput) => authService.login(input), onSuccess: ({ user }) => client.setQueryData(authKeys.me, user) }); }
export function useLogout() { const client = useQueryClient(); return useMutation({ mutationFn: authService.logout, onSettled: () => client.clear() }); }
