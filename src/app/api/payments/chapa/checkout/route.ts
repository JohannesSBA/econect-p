import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

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
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

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
    return NextResponse.json({
      discountApplied: true,
      paymentId: payment.id,
      published: false,
      redirect_url: '/employer/jobs/active',
      message: 'Payment recorded. Listing will be published after admin review.',
    })
  }

  const reference = `job_${jobId}_${Date.now()}`;

  const payment = await prisma.payment.create({
    data: {
      employerId: user.id,
      jobId: jobId,
      amount: numericAmount,
      currency,
      reference,
      provider: 'chapa',
      status: 'PENDING',
      metadata: { jobId },
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirect_url = process.env.CHAPA_RETURN_URL || `${appUrl}/payments/chapa/return`;
  const callback_url = process.env.CHAPA_CALLBACK_URL || `${appUrl}/api/webhooks/chapa`;

  const secretKey = process.env.CHAPA_SECRET_KEY || process.env.TEST_SECRET_KEY;
  const chapaBaseUrl = (process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1').replace(/\/$/, '');
  if (!secretKey) {
    console.error('CHAPA_SECRET_KEY missing – unable to initialize checkout session');
    return NextResponse.json({ error: 'Payment processor not configured' }, { status: 500 });
  }

  const [firstName, ...restNames] = (user.name || 'Employer').split(' ');
  const jobTitle = job.title || 'Job posting';
  const customizationTitle = jobTitle.length > 16 ? `${jobTitle.slice(0, 13)}...` : jobTitle;
  const chapaPayload = {
    amount: numericAmount.toString(),
    currency,
    email: user.email,
    first_name: firstName || 'Employer',
    last_name: restNames.join(' ') || firstName || 'Employer',
    phone_number: user.phone,
    tx_ref: reference,
    callback_url,
    return_url: redirect_url,
    customization: {
      title: customizationTitle,
      description: job.company || 'Job listing',
    },
  };

  const chapaRes = await fetch(`${chapaBaseUrl}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(chapaPayload),
  });

  const chapaData = await chapaRes.json().catch(() => ({}));
  if (!chapaRes.ok || chapaData.status !== 'success') {
    const message = chapaData?.message || 'Failed to initialize payment';
    console.error('Chapa initialize error:', chapaData);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const hosted_url = chapaData?.data?.checkout_url || chapaData?.data?.link;
  if (!hosted_url) {
    console.error('Chapa response missing checkout URL', chapaData);
    return NextResponse.json({ error: 'Payment link unavailable' }, { status: 502 });
  }

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
