import { z } from "zod";

export const AUTOMATION_IMAGE_MAX_BYTES = 50 * 1024 * 1024;
export const AUTOMATION_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const automationImageSchema = z.custom<File>(
  (value) => typeof File !== "undefined" && value instanceof File,
  "Chọn một tệp ảnh hợp lệ.",
).refine(
  (file) => AUTOMATION_IMAGE_TYPES.includes(file.type as (typeof AUTOMATION_IMAGE_TYPES)[number]),
  "Ảnh phải có định dạng JPEG, PNG hoặc WebP.",
).refine(
  (file) => file.size <= AUTOMATION_IMAGE_MAX_BYTES,
  "Ảnh không được vượt quá 50 MiB.",
);

export const campaignSchema = z.object({
  name: z.string().trim().min(3, "Tên chiến dịch cần ít nhất 3 ký tự."),
  contentId: z.string().min(1, "Chọn nội dung."),
  accountIds: z.array(z.string()).min(1, "Chọn ít nhất một tài khoản."),
  scheduledAt: z.string().optional(),
});
export type CampaignInput = z.infer<typeof campaignSchema>;

export const automationCampaignSchema = z.object({
  name: z.string().trim().max(160, "Tên chiến dịch tối đa 160 ký tự."),
  brief: z.string().trim().min(20, "Mô tả cần ít nhất 20 ký tự để AI viết đúng ý.").max(20_000, "Mô tả tối đa 20.000 ký tự."),
  image: automationImageSchema.optional(),
  imageAltText: z.string().trim().max(500, "Mô tả ảnh tối đa 500 ký tự.").optional(),
  accountIds: z.array(z.string()).min(1, "Chọn ít nhất một tài khoản đích."),
  aiProvider: z.enum(["openai", "deepseek", "gemini"]),
  runMode: z.enum(["NOW", "SCHEDULED"]),
  scheduledAt: z.string().optional(),
  confirmAutoPublish: z.boolean().refine(Boolean, "Bạn cần xác nhận trước khi hệ thống đăng bài thật."),
}).superRefine((value, context) => {
  if (value.runMode !== "SCHEDULED") return;
  if (!value.scheduledAt) {
    context.addIssue({
      code: "custom",
      path: ["scheduledAt"],
      message: "Chọn ngày giờ muốn bắt đầu chiến dịch.",
    });
    return;
  }
  if (Number.isNaN(new Date(value.scheduledAt).getTime())) {
    context.addIssue({
      code: "custom",
      path: ["scheduledAt"],
      message: "Ngày giờ lên lịch không hợp lệ.",
    });
    return;
  }
  if (new Date(value.scheduledAt).getTime() <= Date.now()) {
    context.addIssue({
      code: "custom",
      path: ["scheduledAt"],
      message: "Thời gian lên lịch phải ở tương lai.",
    });
  }
});

export type AutomationCampaignInput = z.infer<typeof automationCampaignSchema>;
