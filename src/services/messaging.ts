import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/errors";
import { Logger, traceDb } from "@/lib/logger";

type FetchMessagesParams = {
  currentUserId: string;
  chatPartnerId: string;
  limit: number;
  cursor?: string | null;
  before?: string | null;
  logger: Logger;
};

export async function resolveUserByEmail(email: string, logger: Logger) {
  const user = await traceDb(logger, "message:getUserByEmail", () =>
    prisma.user.findUnique({ where: { email } }),
  );
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return user;
}

async function ensureConnection(currentUserId: string, chatPartnerId: string, logger: Logger) {
  const connection = await traceDb(logger, "message:getConnection", () =>
    prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: chatPartnerId, status: "ACCEPTED" },
          { senderId: chatPartnerId, receiverId: currentUserId, status: "ACCEPTED" },
        ],
      },
    }),
  );

  if (!connection) {
    throw new HttpError(403, "Users must be connected to view messages");
  }
}

export async function fetchConversationMessages(params: FetchMessagesParams) {
  const { currentUserId, chatPartnerId, limit, cursor, before, logger } = params;
  await ensureConnection(currentUserId, chatPartnerId, logger);

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];
  const whereBase = {
    OR: [
      { recipientId: chatPartnerId, senderId: currentUserId },
      { recipientId: currentUserId, senderId: chatPartnerId },
    ],
  } as const;

  const where = before
    ? { AND: [whereBase as any, { createdAt: { lt: new Date(before) } }] }
    : (whereBase as any);

  const results = await traceDb(logger, "message:fetchThread", () =>
    prisma.message.findMany({
      where,
      orderBy,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: safeLimit + 1,
      select: {
        id: true,
        createdAt: true,
        recipientId: true,
        senderId: true,
        text: true,
        replyTo: true,
        isEdited: true,
        editedAt: true,
        sender: {
          select: { id: true, name: true, email: true },
        },
        recipient: {
          select: { id: true, name: true, email: true },
        },
        readAt: true,
        readBy: true,
        attachments: {
          select: {
            id: true,
            type: true,
            url: true,
            filename: true,
            size: true,
            mimeType: true,
            thumbnail: true,
            duration: true,
          },
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            createdAt: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    }),
  );

  const hasMore = results.length > safeLimit;
  const slice = hasMore ? results.slice(0, safeLimit) : results;
  const asc = slice.reverse();

  return {
    messages: asc,
    hasMore,
    nextCursor: asc.length > 0 ? asc[0].id : null,
  };
}
