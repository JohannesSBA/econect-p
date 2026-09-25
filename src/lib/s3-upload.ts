import { PutObjectCommand, S3 } from "@aws-sdk/client-s3";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || process.env.S3ACCESS_KEY_ID || "";
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3SECRET_ACCESS_KEY || "";
const BUCKET = process.env.AWS_S3_BUCKET || process.env.BUCKET_NAME || "";

const s3 = new S3({
  region: AWS_REGION,
  credentials: ACCESS_KEY_ID && SECRET_ACCESS_KEY ? {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  } : undefined,
});

export async function uploadToS3(
  file: File | Blob,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileParams = {
      Bucket: BUCKET as string,
      Key: key,
      ContentType: contentType,
      Body: buffer,
    };

    const command = new PutObjectCommand(fileParams);
    await s3.send(command);

    // Return the S3 URL
    return `https://${BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file");
  }
}

export async function uploadImage(
  file: File,
  userId: string,
  type: "profile" | "company" | "post" = "profile"
): Promise<string> {
  const timestamp = Date.now();
  const key = `${type}-images/${userId}/${timestamp}-${file.name}`;
  return uploadToS3(file, key, file.type);
}

export async function uploadResume(
  file: File,
  userId: string,
  jobId?: string
): Promise<string> {
  const timestamp = Date.now();
  const key = jobId 
    ? `resumes/${userId}/${jobId}/${timestamp}-${file.name}`
    : `resumes/${userId}/${timestamp}-${file.name}`;
  return uploadToS3(file, key, file.type);
}

export async function uploadCoverLetter(
  file: File,
  userId: string,
  jobId: string
): Promise<string> {
  const timestamp = Date.now();
  const key = `cover-letters/${userId}/${jobId}/${timestamp}-${file.name}`;
  return uploadToS3(file, key, file.type);
}

export async function uploadChatAttachment(
  file: File,
  userId: string,
  chatId: string,
): Promise<string> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/\s+/g, "-");
  const key = `chat-attachments/${chatId}/${userId}/${timestamp}-${sanitizedName}`;
  return uploadToS3(file, key, file.type || "application/octet-stream");
}

export function getS3Url(key: string): string {
  return `https://${BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}
