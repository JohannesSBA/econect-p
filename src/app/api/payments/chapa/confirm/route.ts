import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/payments/chapa/confirm
// Dev helper to mark a payment as successful and publish its job
export async function POST(req: NextRequest) {
  if (process.env.CHAPA_DEV_CONFIRM !== 'true') {
    return NextResponse.json({ error: 'Disabled' }, { status: 403 })
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { paymentId } = await req.json();
  if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  if (payment.employerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Mark as paid and publish related job (dev confirmation)
  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID' } });
  if (payment.jobId) {
    await prisma.jobListing.update({ where: { id: payment.jobId }, data: { isPublished: true, status: 'OPEN', publishedAt: new Date() } })
  }

  return NextResponse.json({ ok: true, published: !!payment.jobId, jobId: payment.jobId });
}
