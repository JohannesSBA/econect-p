import { z } from "zod";

export const sendMessageSchema = z.object({
  text: z.string().optional(),
  chatId: z.string().min(1),
  chatPartner: z.string().min(1),
  attachments: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.string().optional(),
        url: z.string().url().optional(),
        filename: z.string().optional(),
        size: z.number().optional(),
        mimeType: z.string().optional(),
        thumbnail: z.string().optional(),
        duration: z.number().optional(),
      }),
    )
    .optional(),
  replyTo: z.string().optional(),
});

export const fetchMessagesSchema = z.object({
  chatPartner: z.string().min(1),
  chatId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().min(1).optional(),
  before: z.string().datetime().optional(),
});

export const threadQuerySchema = z.object({
  userId: z.string().min(1),
});
