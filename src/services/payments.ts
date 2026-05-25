import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/errors";
import { Logger } from "@/lib/logger";
import { isEmployerRole } from "@/lib/authz";

type UserLike = {
  id: string;
  email: string;
  role: string;
  name?: string | null;
  phone?: string | null;
};

type CheckoutPayload = {
  jobId: string;
  amount?: number;
  currency?: string;
  discountCode?: string | null;
};

export async function initiateChapaCheckout({
  user,
  payload,
  logger,
}: {
  user: UserLike;
  payload: CheckoutPayload;
  logger: Logger;
}) {
  if (!isEmployerRole(user.role)) {
    throw new HttpError(403, "Forbidden");
  }

  const { jobId, amount = 50000, currency = "ETB", discountCode } = payload;
  const numericAmount = Number(amount);

  const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
  if (!job || job.employerId !== user.id) {
    throw new HttpError(404, "Job not found");
  }

  const FREE_CODES = new Set(["FREE", "FREE100", "TESTFREE", "ECONNECT-FREE"]);
  if (discountCode && FREE_CODES.has(String(discountCode).toUpperCase())) {
    const reference = `disc_${jobId}_${Date.now()}`;
    const payment = await prisma.payment.create({
      data: {
        employerId: user.id,
        jobId: jobId,
        amount: 0,
        currency,
        reference,
        provider: "chapa",
        status: "PAID",
        metadata: { jobId, discountCode },
      },
    });
    return {
      discountApplied: true,
      paymentId: payment.id,
      published: false,
      redirect_url: "/employer/jobs/active",
      message: "Payment recorded. Listing will be published after admin review.",
    };
  }

  const reference = `job_${jobId}_${Date.now()}`;
  const payment = await prisma.payment.create({
    data: {
      employerId: user.id,
      jobId: jobId,
      amount: numericAmount,
      currency,
      reference,
      provider: "chapa",
      status: "PENDING",
      metadata: { jobId },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirect_url = process.env.CHAPA_RETURN_URL || `${appUrl}/payments/chapa/return`;
  const callback_url = process.env.CHAPA_CALLBACK_URL || `${appUrl}/api/webhooks/chapa`;

  const secretKey = process.env.CHAPA_SECRET_KEY || process.env.TEST_SECRET_KEY;
  const chapaBaseUrl = (process.env.CHAPA_BASE_URL || "https://api.chapa.co/v1").replace(/\/$/, "");
  if (!secretKey) {
    logger.error("CHAPA_SECRET_KEY missing – unable to initialize checkout session", { jobId });
    throw new HttpError(500, "Payment processor not configured");
  }

  const [firstName, ...restNames] = (user.name || "Employer").split(" ");
  const jobTitle = job.title || "Job posting";
  const customizationTitle = jobTitle.length > 16 ? `${jobTitle.slice(0, 13)}...` : jobTitle;
  const chapaPayload = {
    amount: numericAmount.toString(),
    currency,
    email: user.email,
    first_name: firstName || "Employer",
    last_name: restNames.join(" ") || firstName || "Employer",
    phone_number: user.phone,
    tx_ref: reference,
    callback_url,
    return_url: redirect_url,
    customization: {
      title: customizationTitle,
      description: job.company || "Job listing",
    },
  };

  const chapaRes = await fetch(`${chapaBaseUrl}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(chapaPayload),
  });

  const chapaData = await chapaRes.json().catch(() => ({}));
  if (!chapaRes.ok || chapaData.status !== "success") {
    const message = chapaData?.message || "Failed to initialize payment";
    logger.error("Chapa initialize error", { message, jobId, response: chapaData });
    throw new HttpError(502, message);
  }

  const hosted_url = chapaData?.data?.checkout_url || chapaData?.data?.link;
  if (!hosted_url) {
    logger.error("Chapa response missing checkout URL", { jobId, response: chapaData });
    throw new HttpError(502, "Payment link unavailable");
  }

  return {
    checkout: {
      reference,
      hosted_url,
      redirect_url,
      callback_url,
    },
    paymentId: payment.id,
  };
}

export async function confirmChapaPayment({
  user,
  paymentId,
  logger,
}: {
  user: UserLike;
  paymentId: string;
  logger: Logger;
}) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new HttpError(404, "Payment not found");
  if (payment.employerId !== user.id) throw new HttpError(403, "Forbidden");

  const devConfirm = process.env.CHAPA_DEV_CONFIRM === "true";
  if (devConfirm) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID" } });
    return { ok: true, published: false, jobId: payment.jobId, mode: "dev" as const };
  }

  const secretKey = process.env.CHAPA_SECRET_KEY || process.env.TEST_SECRET_KEY;
  if (!secretKey) {
    throw new HttpError(500, "Payment processor not configured");
  }
  const chapaBaseUrl = (process.env.CHAPA_BASE_URL || "https://api.chapa.co/v1").replace(/\/$/, "");
  const verifyUrl = `${chapaBaseUrl}/transaction/verify/${payment.reference}`;

  const verifyRes = await fetch(verifyUrl, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const verifyBody = await verifyRes.json().catch(() => ({}));

  if (!verifyRes.ok || verifyBody?.status !== "success") {
    logger.error("Chapa verify failed", { paymentId, response: verifyBody });
    throw new HttpError(400, verifyBody?.message || "Verification failed");
  }

  const txnStatus = String(verifyBody?.data?.status || "").toLowerCase();
  if (txnStatus !== "success") {
    throw new HttpError(409, "Payment not completed yet");
  }

  const existingMetadata =
    payment.metadata && typeof payment.metadata === "object" ? payment.metadata : {};
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      metadata: {
        ...(existingMetadata as Record<string, unknown>),
        chapaVerification: verifyBody.data,
      },
    },
  });

  return { ok: true, published: false, jobId: payment.jobId, mode: "verify" as const };
}
