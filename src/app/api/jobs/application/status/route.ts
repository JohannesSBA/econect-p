import { NextRequest, NextResponse } from "next/server";

import { withHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { updateApplicationStatus } from "@/services/applications";
import { updateApplicationStatusSchema } from "@/lib/validation/applications";

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();

  const parsed = updateApplicationStatusSchema.parse(await req.json());

  const { application, job } = await updateApplicationStatus({
    applicationId: parsed.applicationId,
    status: parsed.status,
    actorId: user.id,
    actorRole: user.role,
    notify: parsed.notify,
  });

  if (parsed.notify) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_KEY || "");
      const applicant = await import("@/lib/prisma").then((m) =>
        m.default.user.findUnique({
          where: { id: application.userId },
          select: { email: true, name: true },
        }),
      );
      if (applicant?.email) {
        const jobTitle = job.title ?? "the role";
        const company = job.company ?? "our company";
        await resend.emails.send({
          from: process.env.RESEND_FROM || "no-reply@example.com",
          to: applicant.email,
          subject:
            parsed.status === "ACCEPTED"
              ? `Next round interview — ${jobTitle}`
              : `Application ${parsed.status} — ${jobTitle}`,
          html: buildStatusEmail({ applicant, jobTitle, company, status: parsed.status }),
        });
      }
    } catch {
      // email is best-effort
    }
  }

  return NextResponse.json({ application });
});

function buildStatusEmail(opts: {
  applicant: { name: string | null } | null;
  jobTitle: string;
  company: string;
  status: string;
}) {
  const { applicant, jobTitle, company, status } = opts;
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
          <tr><td style="background:linear-gradient(90deg,#1d4ed8,#7c3aed);padding:24px 28px;color:#fff;font-size:18px;font-weight:700;">Econnect • Application Update</td></tr>
          <tr><td style="padding:28px 28px 8px;color:#111827;font-size:16px;">Hi ${applicant?.name ?? "there"},</td></tr>
          <tr><td style="padding:0 28px 12px;color:#6b7280;font-size:14px;">Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> is now: <strong>${status}</strong>.</td></tr>
          ${status === "ACCEPTED" ? `<tr><td style="padding:0 28px 12px;color:#111827;font-size:14px;">Congrats — you have been selected for the next round!</td></tr>` : ""}
          <tr><td style="padding:8px 28px 28px;"><a href="${appUrl}/jobs" style="background:#2563eb;color:#fff;font-weight:600;text-decoration:none;padding:10px 14px;border-radius:8px;display:inline-block;">View Jobs</a></td></tr>
        </table>
      </td></tr>
    </table>`;
}
