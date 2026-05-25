import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { HttpError } from "@/lib/errors";
import { getRequestLogger } from "@/lib/logger";
import { fetchMessagesSchema } from "@/lib/validation/messages";
import { fetchConversationMessages, resolveUserByEmail } from "@/services/messaging";

export async function POST(req: NextRequest) {
  const logger = getRequestLogger(req, { route: "api:message:get" });
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await resolveUserByEmail(session.user.email ?? "", logger);

    const body = await req.json();
    const parsed = fetchMessagesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { chatPartner, limit = 15, before, cursor } = parsed.data;

    const { messages, hasMore, nextCursor } = await fetchConversationMessages({
      currentUserId: user.id,
      chatPartnerId: chatPartner,
      limit,
      cursor,
      before: before ?? null,
      logger,
    });

    return NextResponse.json({ messages, hasMore, nextCursor });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error fetching messages", { error });
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
