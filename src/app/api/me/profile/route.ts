
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function POST(request: Request) {
    const { about } = await request.json();
    const session = await getServerSession(authOptions);
    console.log(session);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
        where: { id: session.user?.id },
    });
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    await prisma.user.update({
        where: { id: user.id },
        data: {
            profile: {
                update: {
                    bio: about
                }
            }
        }
    });
    return NextResponse.json({ message: "Profile updated" }, { status: 200 });
}


