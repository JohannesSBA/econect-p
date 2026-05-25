import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import { paymentStatusSchema } from "@/lib/validation/payments";

// GET /api/payments/status?paymentId=...
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url)
  const parsed = paymentStatusSchema.safeParse({
    paymentId: searchParams.get('paymentId'),
  })
  if (!parsed.success) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
  const { paymentId } = parsed.data

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ status: payment.status, jobId: payment.jobId })
}
