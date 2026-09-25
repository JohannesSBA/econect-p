import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-webhook-signature') || '';
    if (!WEBHOOK_SECRET || signature !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = await req.json();
    const { reference, status } = payload || {};
    if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 });

    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    if (status === 'success' || status === 'paid') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID' } });
    } else if (status === 'failed' || status === 'canceled') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Chapa webhook error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
