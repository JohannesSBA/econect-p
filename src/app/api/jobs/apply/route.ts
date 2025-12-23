import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { publishedJobWhere } from "@/lib/jobFilters"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    if (user.role !== 'JOB_SEEKER') {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { jobId, userId, coverLetter, resumeUrl } = body

    // Validate inputs
    if (!jobId || !userId || !resumeUrl) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Check if job exists and is publishable
    const job = await prisma.jobListing.findFirst({
      where: { id: jobId, ...publishedJobWhere },
    })

    if (!job) {
      return NextResponse.json({ message: "Job not found or not open" }, { status: 404 })
    }

    // Check if user has already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId: jobId
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json({ message: "You have already applied for this job" }, { status: 400 })
    }

    // Create the application
    const application = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        jobId: jobId,
        coverLetter: coverLetter || null,
        resumeUrl: resumeUrl,
        status: "pending"
      }
    })

    // Notify employer of new application
    await prisma.notification.create({
      data: {
        userId: job.employerId,
        type: 'APPLICATION_UPDATE',
        title: 'New job application',
        message: `${user.name} applied to ${job.title}`,
        data: { jobId, applicantId: user.id, applicationId: application.id },
      }
    })

    return NextResponse.json({ 
      message: "Application submitted successfully",
      applicationId: application.id
    }, { status: 201 })

  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 
