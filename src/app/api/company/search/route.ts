import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/company/search?q=...  -> returns employer/recruiter users as companies
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ companies: [] });

  try {
    const companies = await prisma.user.findMany({
      where: {
        AND: [
          { OR: [{ role: 'EMPLOYER' }, { role: 'RECRUITER' }] },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        headline: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Company search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

