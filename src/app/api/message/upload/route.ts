import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { rateLimit } from "@/lib/rateLimiter";
import { uploadChatAttachment } from "@/lib/s3-upload";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

export const POST = withHandler(async (req: NextRequest) => {
  const rl = rateLimit(req, "message:upload", 30, 60 * 1000);
  if (!rl.allowed) throw new HttpError(429, `Too many uploads. Retry in ${rl.retryAfterSeconds}s.`);

  const user = await requireUser();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const chatId = formData.get("chatId") as string | null;

  if (!file) throw new HttpError(400, "No file provided");
  if (!chatId) throw new HttpError(400, "Chat ID is required");
  if (file.size > MAX_FILE_SIZE) throw new HttpError(413, "File too large. Maximum size is 10MB");
  if (!ALLOWED_TYPES.has(file.type)) throw new HttpError(415, "File type not allowed");

  const fileUrl = await uploadChatAttachment(file, user.id, chatId);

  let fileType: "image" | "video" | "audio" | "document" | "file" = "file";
  if (file.type.startsWith("image/")) fileType = "image";
  else if (file.type.startsWith("video/")) fileType = "video";
  else if (file.type.startsWith("audio/")) fileType = "audio";
  else if (file.type.startsWith("application/") || file.type.startsWith("text/")) fileType = "document";

  return NextResponse.json({
    type: fileType,
    url: fileUrl,
    filename: file.name,
    size: file.size,
    mimeType: file.type,
    thumbnail: null,
    duration: null,
  });
});
