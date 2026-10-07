import { z } from "zod";
export const campaignSchema = z.object({
  name: z.string().trim().min(3, "Tên chiến dịch cần ít nhất 3 ký tự."),
  contentId: z.string().min(1, "Chọn nội dung."),
  accountIds: z.array(z.string()).min(1, "Chọn ít nhất một tài khoản."),
  scheduledAt: z.string().optional(),
});
export type CampaignInput = z.infer<typeof campaignSchema>;
