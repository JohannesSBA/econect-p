import { z } from "zod";

import { HttpError } from "@/lib/errors";

const MB = 1024 * 1024;

export const UPLOAD_CONFIGS = {
  "profile-image": {
    maxBytes: 5 * MB,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  "company-image": {
    maxBytes: 5 * MB,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  "post-image": {
    maxBytes: 10 * MB,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  resume: {
    maxBytes: 10 * MB,
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  "cover-letter": {
    maxBytes: 5 * MB,
    allowedTypes: [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
} as const;

export type UploadType = keyof typeof UPLOAD_CONFIGS;

export const uploadTypeSchema = z.enum([
  "profile-image",
  "company-image",
  "post-image",
  "resume",
  "cover-letter",
]);

export function validateUploadFile(file: File, type: UploadType): void {
  const config = UPLOAD_CONFIGS[type];

  if (file.size > config.maxBytes) {
    const maxMB = config.maxBytes / MB;
    throw new HttpError(413, `File too large. Maximum size is ${maxMB}MB`);
  }

  if (!(config.allowedTypes as readonly string[]).includes(file.type)) {
    throw new HttpError(
      415,
      `File type "${file.type}" not allowed for ${type}. Allowed: ${config.allowedTypes.join(", ")}`,
    );
  }
}
