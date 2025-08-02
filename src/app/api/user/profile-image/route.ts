import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ message: "Image URL is required" }, { status: 400 });
    }

    // Update the user's profile image in the database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json({ 
      message: "Profile image updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        headline: updatedUser.headline,
        role: updatedUser.role
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating profile image:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 