import { z } from "zod";
export const sourceSchema = z.object({
  name: z.string().trim().min(2, "Nhập tên nguồn."),
  type: z.enum(["MANUAL", "URL", "RSS", "SITEMAP", "WORDPRESS"]),
  url: z.string().trim().optional(),
  content: z.string().trim().optional(),
}).superRefine((value, context) => {
  if (value.type === "MANUAL" && (!value.content || value.content.length < 20)) context.addIssue({ code: "custom", path: ["content"], message: "Nội dung thủ công cần ít nhất 20 ký tự." });
  if (value.type !== "MANUAL") { const result = z.url().safeParse(value.url); if (!result.success) context.addIssue({ code: "custom", path: ["url"], message: "Nhập URL hợp lệ." }); }
});
export type SourceInput = z.infer<typeof sourceSchema>;
