import { PutObjectCommand, S3 } from "@aws-sdk/client-s3";

const s3 = new S3({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3ACCESS_KEY_ID as string,
    secretAccessKey: process.env.S3SECRET_ACCESS_KEY as string,
  },
});

export async function uploadToS3(
  file: File | Blob,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileParams = {
      Bucket: process.env.BUCKET_NAME as string,
      Key: key,
      ContentType: contentType,
      Body: buffer,
    };

    const command = new PutObjectCommand(fileParams);
    await s3.send(command);

    // Return the S3 URL
    return `https://${process.env.BUCKET_NAME}.s3.us-east-1.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file");
  }
}

export async function uploadImage(
  file: File,
  userId: string,
  type: "profile" | "company" = "profile"
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

export function getS3Url(key: string): string {
  return `https://${process.env.BUCKET_NAME}.s3.us-east-1.amazonaws.com/${key}`;
} 