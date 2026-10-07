import { z } from "zod";
export const settingsSchema = z.object({
  model: z.string().min(1), temperature: z.coerce.number().min(0).max(2), storageProvider: z.string().min(1), bucket: z.string(), timezone: z.string().min(1), defaultLocale: z.string().min(2), pollingInterval: z.coerce.number().int().min(3000).max(120000),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
