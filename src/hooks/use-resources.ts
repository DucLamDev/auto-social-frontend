"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resourcesService, type ListParams } from "@/services/resources.service";
import { env } from "@/config/env";

export const resourceKeys = {
  aiProviders: ["ai-providers"] as const,
  platforms: (params?: ListParams) => ["platforms", params ?? {}] as const,
  accounts: (params?: ListParams) => ["accounts", params ?? {}] as const,
  sources: (params?: ListParams) => ["sources", params ?? {}] as const,
  sourceArticles: (params?: ListParams) => ["source-articles", params ?? {}] as const,
  contents: (params?: ListParams) => ["contents", params ?? {}] as const,
  content: (id: string) => ["content", id] as const,
  variants: (id: string) => ["variants", id] as const,
  campaigns: (params?: ListParams) => ["campaigns", params ?? {}] as const,
  jobs: (params?: ListParams) => ["publish-jobs", params ?? {}] as const,
  jobMetrics: (todayFrom: string, todayTo: string) => ["publish-job-metrics", todayFrom, todayTo] as const,
  prompts: ["prompts"] as const, logs: (params?: ListParams) => ["logs", params ?? {}] as const, settings: ["settings"] as const,
  publishLogs: (params?: ListParams) => ["publish-logs", params ?? {}] as const,
  oauthProviders: ["oauth-providers"] as const,
  media: (params?: ListParams) => ["media", params ?? {}] as const,
};
export function useAiProviders() { return useQuery({ queryKey: resourceKeys.aiProviders, queryFn: resourcesService.aiProviders, staleTime: 300_000 }); }
export function usePlatforms(params?: ListParams) { return useQuery({ queryKey: resourceKeys.platforms(params), queryFn: () => resourcesService.platforms(params) }); }
export function useAccounts(params?: ListParams) { return useQuery({ queryKey: resourceKeys.accounts(params), queryFn: () => resourcesService.accounts(params) }); }
export function useOAuthProviders() { return useQuery({ queryKey: resourceKeys.oauthProviders, queryFn: resourcesService.oauthProviders, staleTime: 300_000 }); }
export function useSources(params?: ListParams) { return useQuery({ queryKey: resourceKeys.sources(params), queryFn: () => resourcesService.sources(params) }); }
export function useSourceArticles(params?: ListParams) { return useQuery({ queryKey: resourceKeys.sourceArticles(params), queryFn: () => resourcesService.sourceArticles(params) }); }
export function useContents(params?: ListParams) { return useQuery({ queryKey: resourceKeys.contents(params), queryFn: () => resourcesService.contents(params) }); }
export function useContent(id: string) { return useQuery({ queryKey: resourceKeys.content(id), queryFn: () => resourcesService.content(id), enabled: Boolean(id) }); }
export function useVariants(id: string) { return useQuery({ queryKey: resourceKeys.variants(id), queryFn: () => resourcesService.variants(id), enabled: Boolean(id), refetchInterval: (query) => query.state.data?.items.some((v) => v.status === "AI_GENERATING") ? 3_000 : false }); }
export function useCampaigns(params?: ListParams) { return useQuery({ queryKey: resourceKeys.campaigns(params), queryFn: () => resourcesService.campaigns(params) }); }
export function usePublishJobs(params?: ListParams, polling = true) { return useQuery({ queryKey: resourceKeys.jobs(params), queryFn: () => resourcesService.publishJobs(params), refetchInterval: polling ? env.pollIntervalMs : false }); }
export function usePublishJobMetrics(todayFrom: string, todayTo: string) { return useQuery({ queryKey: resourceKeys.jobMetrics(todayFrom, todayTo), queryFn: () => resourcesService.publishJobMetrics(todayFrom, todayTo), refetchInterval: env.pollIntervalMs }); }
export function usePrompts() { return useQuery({ queryKey: resourceKeys.prompts, queryFn: () => resourcesService.prompts() }); }
export function useLogs(params?: ListParams, enabled = true) { return useQuery({ queryKey: resourceKeys.publishLogs(params), queryFn: () => resourcesService.publishLogs(params), enabled }); }
export function useAudit(params?: ListParams, enabled = true) { return useQuery({ queryKey: resourceKeys.logs(params), queryFn: () => resourcesService.logs(params), enabled }); }
export const usePublishLogs = useLogs;
export function useMedia(params?: ListParams) { return useQuery({ queryKey: resourceKeys.media(params), queryFn: () => resourcesService.media(params) }); }
export function useSettings() { return useQuery({ queryKey: resourceKeys.settings, queryFn: resourcesService.settings }); }
export function useInvalidate() { const client = useQueryClient(); return (...keys: string[]) => Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: [key] }))); }
export function useResourceMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>, invalidate: string[]) { const client = useQueryClient(); return useMutation({ mutationFn, onSuccess: async () => { await Promise.all(invalidate.map((key) => client.invalidateQueries({ queryKey: [key] }))); } }); }
