import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  title: z.string().max(200).optional().nullable(),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "LINK", "ARTICLE"]).optional().default("TEXT"),
  images: z.array(z.string().url()).max(3).optional().default([]),
  linkUrl: z.string().url().optional().nullable(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const reportPostSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const messageReactionSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().min(1).max(10),
});

export const editMessageSchema = z.object({
  text: z.string().min(1).max(5000),
});
