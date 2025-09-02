import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || (user.role !== 'EMPLOYER' && user.role !== 'ADMIN' && user.role !== 'RECRUITER')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { jobId, amount = 50000, currency = 'ETB', discountCode } = body || {};
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

  const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
  if (!job || job.employerId !== user.id) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // 1) Discount codes (dev/test): allow free posting when valid code provided
  const FREE_CODES = new Set([ 'FREE', 'FREE100', 'TESTFREE', 'ECONNECT-FREE' ]);
  if (discountCode && FREE_CODES.has(String(discountCode).toUpperCase())) {
    const reference = `disc_${jobId}_${Date.now()}`;
    const payment = await prisma.payment.create({
      data: {
        employerId: user.id,
        jobId: jobId,
        amount: 0,
        currency,
        reference,
        provider: 'chapa',
        status: 'PAID',
        metadata: { jobId, discountCode },
      }
    });
    // Immediately publish the job
    await prisma.jobListing.update({
      where: { id: jobId },
      data: { isPublished: true, status: 'OPEN', publishedAt: new Date() },
    })
    return NextResponse.json({
      discountApplied: true,
      paymentId: payment.id,
      published: true,
      redirect_url: '/employer/jobs/active',
    })
  }

  const reference = `job_${jobId}_${Date.now()}`;

  const payment = await prisma.payment.create({
    data: {
      employerId: user.id,
      jobId: jobId,
      amount,
      currency,
      reference,
      provider: 'chapa',
      status: 'PENDING',
      metadata: { jobId },
    }
  });

  // Prefer a pre-configured Chapa payment link (provided by user) for redirection
  const redirect_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/chapa/return`;
  const callback_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/chapa`;

  const token = crypto.createHash('sha256').update(reference + CHAPA_SECRET_KEY).digest('hex');
  const hosted_url = process.env.NEXT_PUBLIC_CHAPA_PAYMENT_LINK || 'https://checkout.chapa.co/checkout/web/payment/PL-zBZ0KqFcoZmW';

  return NextResponse.json({
    checkout: {
      reference,
      hosted_url,
      redirect_url,
      callback_url,
    },
    paymentId: payment.id,
  });
}
