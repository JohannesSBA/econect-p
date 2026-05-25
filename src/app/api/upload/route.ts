import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { uploadImage, uploadResume, uploadCoverLetter } from "@/lib/s3-upload";
import {
  uploadTypeSchema,
  validateUploadFile,
  type UploadType,
} from "@/lib/validation/uploads";

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const rawType = formData.get("type") as string | null;
  const jobId = formData.get("jobId") as string | null;

  if (!file) throw new HttpError(400, "File is required");

  const typeResult = uploadTypeSchema.safeParse(rawType);
  if (!typeResult.success) throw new HttpError(400, "Invalid upload type");

  const type = typeResult.data as UploadType;
  validateUploadFile(file, type);

  let fileUrl: string;

  switch (type) {
    case "profile-image":
      fileUrl = await uploadImage(file, user.id, "profile");
      break;
    case "company-image":
      fileUrl = await uploadImage(file, user.id, "company");
      break;
    case "post-image":
      fileUrl = await uploadImage(file, user.id, "post");
      break;
    case "resume":
      fileUrl = await uploadResume(file, user.id, jobId ?? undefined);
      break;
    case "cover-letter":
      if (!jobId) throw new HttpError(400, "Job ID is required for cover letter");
      fileUrl = await uploadCoverLetter(file, user.id, jobId);
      break;
  }

  return NextResponse.json({ message: "File uploaded successfully", fileUrl });
});
