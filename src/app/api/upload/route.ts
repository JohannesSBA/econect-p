import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { uploadImage, uploadResume, uploadCoverLetter } from "@/lib/s3-upload";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const jobId = formData.get("jobId") as string;

    if (!file) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }

    let fileUrl: string;

    switch (type) {
      case "profile-image":
        fileUrl = await uploadImage(file, user.id, "profile");
        break;
      case "company-image":
        fileUrl = await uploadImage(file, user.id, "company");
        break;
      case "resume":
        fileUrl = await uploadResume(file, user.id, jobId);
        break;
      case "cover-letter":
        if (!jobId) {
          return NextResponse.json({ message: "Job ID is required for cover letter" }, { status: 400 });
        }
        fileUrl = await uploadCoverLetter(file, user.id, jobId);
        break;
      default:
        return NextResponse.json({ message: "Invalid file type" }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "File uploaded successfully",
      fileUrl 
    }, { status: 200 });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 