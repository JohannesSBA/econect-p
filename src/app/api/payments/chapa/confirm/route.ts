import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/payments/chapa/confirm
// Verifies a payment against Chapa (or forces success in dev mode)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { paymentId } = await req.json();
  if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  if (payment.employerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const devConfirm = process.env.CHAPA_DEV_CONFIRM === 'true';
  if (devConfirm) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID' } });
    if (payment.jobId) {
      await prisma.jobListing.update({ where: { id: payment.jobId }, data: { isPublished: true, status: 'OPEN', publishedAt: new Date() } })
    }
    return NextResponse.json({ ok: true, published: !!payment.jobId, jobId: payment.jobId, mode: 'dev' });
  }

  const secretKey = process.env.CHAPA_SECRET_KEY || process.env.TEST_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Payment processor not configured' }, { status: 500 });
  }
  const chapaBaseUrl = (process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1').replace(/\/$/, '');
  const verifyUrl = `${chapaBaseUrl}/transaction/verify/${payment.reference}`;

  const verifyRes = await fetch(verifyUrl, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  const verifyBody = await verifyRes.json().catch(() => ({}));

  if (!verifyRes.ok || verifyBody?.status !== 'success') {
    console.error('Chapa verify failed', verifyBody);
    return NextResponse.json({ error: verifyBody?.message || 'Verification failed' }, { status: 400 });
  }

  const txnStatus = String(verifyBody?.data?.status || '').toLowerCase();
  if (txnStatus !== 'success') {
    return NextResponse.json({ error: 'Payment not completed yet', status: txnStatus || 'unknown' }, { status: 409 });
  }

  const existingMetadata = (payment.metadata && typeof payment.metadata === 'object') ? payment.metadata : {};
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      metadata: {
        ...(existingMetadata as Record<string, unknown>),
        chapaVerification: verifyBody.data,
      }
    }
  });

  if (payment.jobId) {
    await prisma.jobListing.update({ where: { id: payment.jobId }, data: { isPublished: true, status: 'OPEN', publishedAt: new Date() } })
  }

  return NextResponse.json({ ok: true, published: !!payment.jobId, jobId: payment.jobId, mode: 'verify' });
}
