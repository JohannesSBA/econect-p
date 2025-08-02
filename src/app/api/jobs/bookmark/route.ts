import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/getCurrentUser"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ message: "Job ID is required" }, { status: 400 })
    }

    // Check if job exists
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.jobBookmark.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId: jobId
        }
      }
    })

    if (existingBookmark) {
      return NextResponse.json({ message: "Job already bookmarked" }, { status: 400 })
    }

    // Create bookmark
    const bookmark = await prisma.jobBookmark.create({
      data: {
        userId: user.id,
        jobId: jobId
      }
    })

    return NextResponse.json({ 
      message: "Job bookmarked successfully",
      bookmarkId: bookmark.id
    }, { status: 201 })

  } catch (error) {
    console.error("Error bookmarking job:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ message: "Job ID is required" }, { status: 400 })
    }

    // Delete bookmark
    await prisma.jobBookmark.deleteMany({
      where: {
        userId: user.id,
        jobId: jobId
      }
    })

    return NextResponse.json({ message: "Bookmark removed successfully" }, { status: 200 })

  } catch (error) {
    console.error("Error removing bookmark:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 