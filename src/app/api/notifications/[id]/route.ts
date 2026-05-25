import { NextRequest, NextResponse } from "next/server";

import { withHandler, type RouteContext } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export const PATCH = withHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const user = await requireUser();
  const { id } = await ctx!.params;

  const body = await req.json();
  const read = typeof body?.read === "boolean" ? body.read : undefined;

  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.userId !== user.id) throw new HttpError(404, "Not found");

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: read ?? notif.read },
  });

  return NextResponse.json(updated);
});

export const DELETE = withHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  const user = await requireUser();
  const { id } = await ctx!.params;

  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.userId !== user.id) throw new HttpError(404, "Not found");

  await prisma.notification.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
