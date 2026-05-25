import { describe, expect, it } from "vitest";

import { validateUploadFile, UPLOAD_CONFIGS, uploadTypeSchema } from "@/lib/validation/uploads";
import { HttpError } from "@/lib/errors";

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe("uploadTypeSchema", () => {
  it("accepts valid upload types", () => {
    expect(uploadTypeSchema.parse("profile-image")).toBe("profile-image");
    expect(uploadTypeSchema.parse("resume")).toBe("resume");
    expect(uploadTypeSchema.parse("cover-letter")).toBe("cover-letter");
  });

  it("rejects invalid types", () => {
    expect(uploadTypeSchema.safeParse("malware").success).toBe(false);
    expect(uploadTypeSchema.safeParse("").success).toBe(false);
  });
});

describe("validateUploadFile — profile-image", () => {
  it("accepts a valid JPEG under the size limit", () => {
    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    expect(() => validateUploadFile(file, "profile-image")).not.toThrow();
  });

  it("rejects a file exceeding the size limit", () => {
    const file = makeFile("big.jpg", "image/jpeg", 6 * 1024 * 1024);
    expect(() => validateUploadFile(file, "profile-image")).toThrow(HttpError);
    expect(() => validateUploadFile(file, "profile-image")).toThrow(/too large/);
  });

  it("rejects a disallowed MIME type", () => {
    const file = makeFile("doc.pdf", "application/pdf", 100);
    expect(() => validateUploadFile(file, "profile-image")).toThrow(HttpError);
    expect(() => validateUploadFile(file, "profile-image")).toThrow(/not allowed/);
  });
});

describe("validateUploadFile — resume", () => {
  it("accepts PDF", () => {
    const file = makeFile("cv.pdf", "application/pdf", 500_000);
    expect(() => validateUploadFile(file, "resume")).not.toThrow();
  });

  it("accepts DOCX", () => {
    const file = makeFile(
      "cv.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      200_000,
    );
    expect(() => validateUploadFile(file, "resume")).not.toThrow();
  });

  it("rejects image files as resume", () => {
    const file = makeFile("photo.jpg", "image/jpeg", 100);
    expect(() => validateUploadFile(file, "resume")).toThrow(HttpError);
  });

  it("rejects files over 10MB", () => {
    const file = makeFile("huge.pdf", "application/pdf", 11 * 1024 * 1024);
    expect(() => validateUploadFile(file, "resume")).toThrow(/too large/);
  });
});

describe("UPLOAD_CONFIGS", () => {
  it("cover-letter allows PDF and DOCX but not image", () => {
    const { allowedTypes } = UPLOAD_CONFIGS["cover-letter"];
    expect(allowedTypes).toContain("application/pdf");
    expect(allowedTypes as readonly string[]).not.toContain("image/jpeg");
  });

  it("company-image does not allow GIF", () => {
    const { allowedTypes } = UPLOAD_CONFIGS["company-image"];
    expect(allowedTypes as readonly string[]).not.toContain("image/gif");
  });
});
