import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/jobs/application/status
// Body: { applicationId: string, status: string }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { applicationId, status, notify } = await req.json();
  if (!applicationId || !status) {
    return NextResponse.json({ error: "applicationId and status are required" }, { status: 400 });
  }

  // Fetch application and ensure current user is the job's employer
  const app = await prisma.jobApplication.findUnique({ where: { id: applicationId } });

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const job = await prisma.jobListing.findUnique({ where: { id: app.jobId }, select: { employerId: true } });
  if (!job || (job.employerId !== user.id && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const validStatuses = new Set([
    'APPLIED', 'VIEWED', 'INTERVIEWED', 'HIRED', 'REJECTED', 'ACCEPTED', 'pending'
  ]);

  const nextStatus = String(status).toUpperCase();
  if (!validStatuses.has(nextStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: nextStatus },
    include: { user: { select: { id: true, name: true, email: true } } } as any
  } as any);
  const jobInfo = await prisma.jobListing.findUnique({ where: { id: updated.jobId }, select: { id: true, title: true, company: true } });

  // Only send notification/email when explicitly confirmed by the employer
  if (notify === true) {
    try {
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          type: 'APPLICATION_UPDATE',
          title: `Application status: ${nextStatus}`,
          message: `Your application for ${jobInfo?.title || 'a job'} at ${jobInfo?.company || ''} is now ${nextStatus}.`,
          data: { jobId: jobInfo?.id, applicationId: updated.id, status: nextStatus },
        }
      })
    } catch {}

    // Send email via Resend (best-effort)
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_KEY || '')
      const applicant = await prisma.user.findUnique({ where: { id: updated.userId }, select: { email: true, name: true } })
      if (applicant?.email) {
        const primary = '#2563eb'
        const text = '#111827'
        const muted = '#6b7280'
        const bg = '#f8fafc'
        const btn = primary
        const jobTitle = jobInfo?.title || 'the role'
        const company = jobInfo?.company || 'our company'
        await resend.emails.send({
          from: process.env.RESEND_FROM || 'no-reply@example.com',
          to: applicant.email,
          subject: nextStatus === 'ACCEPTED' ? `Next round interview — ${jobTitle}` : `Application ${nextStatus} — ${jobTitle}`,
          html: `
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:32px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(2,6,23,0.08)">
                    <tr>
                      <td style="background:linear-gradient(90deg,#1d4ed8,#7c3aed);padding:24px 28px;color:#fff;font-size:18px;font-weight:700;">
                        Econnect • Application Update
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:28px 28px 8px 28px;color:${text};font-size:16px;">
                        Hi ${applicant?.name || 'there'},
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 28px 12px 28px;color:${muted};font-size:14px;">
                        Your application status for <strong style="color:${text}">${jobTitle}</strong> at <strong style="color:${text}">${company}</strong> was updated to:
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 28px 16px 28px;">
                        <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:${bg};border:1px solid #e5e7eb;color:${text};font-weight:600;font-size:12px;letter-spacing:.3px;text-transform:uppercase;">
                          ${nextStatus}
                        </div>
                      </td>
                    </tr>
                    ${nextStatus === 'ACCEPTED' ? `
                    <tr>
                      <td style="padding:0 28px 12px 28px;color:${text};font-size:14px;">
                        Congrats — you have been selected for the next round! Our team will follow up with interview details.
                      </td>
                    </tr>` : ''}
                    <tr>
                      <td style="padding:8px 28px 28px 28px;">
                        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/en/jobs" style="display:inline-block;background:${btn};color:#fff;font-weight:600;text-decoration:none;padding:10px 14px;border-radius:8px">View Jobs</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 28px;color:${muted};font-size:12px;border-top:1px solid #f1f5f9;">
                        You’re receiving this email because you applied on Econnect.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `,
        })
      }
    } catch {}
  }

  return NextResponse.json({ application: updated });
}
