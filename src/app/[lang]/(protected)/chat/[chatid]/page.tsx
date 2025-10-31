import Link from "next/link";
import { notFound } from "next/navigation";
import MessagingInterface from "../components/MessagingInterface";
import { getCurrentUser } from "@/lib/getCurrentUser";
import prisma from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ lang: "en" | "am"; chatid: string }>;
}) {
  const { chatid, lang } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return notFound();
  }

  const [first, second] = (chatid ?? "").split("--");
  if (!first || !second) {
    return notFound();
  }

  const userId = currentUser.id;
  const friendId = userId === first ? second : userId === second ? first : null;

  if (!friendId) {
    return notFound();
  }

  const [
    blockedEntry,
    participants,
    connection,
    messageRequest,
    previousMessage,
  ] = await Promise.all([
    prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: friendId },
          { blockerId: friendId, blockedId: userId },
        ],
      },
      select: { id: true },
    }),
    prisma.user.findMany({
      where: { id: { in: [userId, friendId] } },
      select: { id: true, role: true },
    }),
    prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId, status: "ACCEPTED" },
          { senderId: friendId, receiverId: userId, status: "ACCEPTED" },
        ],
      },
      select: { id: true },
    }),
    prisma.messageRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, recipientId: friendId },
          { senderId: friendId, recipientId: userId },
        ],
      },
      select: { id: true },
    }),
    prisma.message.findFirst({
      where: {
        OR: [
          { senderId: userId, recipientId: friendId },
          { senderId: friendId, recipientId: userId },
        ],
      },
      select: { id: true },
    }),
  ]);

  if (blockedEntry) {
    return notFound();
  }

  const elevatedRoles = new Set(["EMPLOYER", "RECRUITER", "ADMIN"]);
  const eitherElevated = participants.some(({ role }) =>
    elevatedRoles.has(role as string),
  );

  const accessGranted = Boolean(
    connection || eitherElevated || messageRequest || previousMessage,
  );

  if (!accessGranted) {
    return notFound();
  }

  const chatPartner = await prisma.user.findUnique({
    where: { id: friendId },
    select: {
      id: true,
      name: true,
      image: true,
      headline: true,
      email: true,
    },
  });

  if (!chatPartner) {
    return notFound();
  }

  const profileHref = `/${lang}/(protected)/user/${chatPartner.id}`;
  const partnerInitial = (chatPartner.name || "U").slice(0, 1).toUpperCase();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="sticky top-0 z-30 -mx-3 sm:mx-0">
        <div className="rounded-3xl border border-white/60 bg-white/95 px-6 py-5 shadow-xl backdrop-blur supports-[backdrop-filter]:backdrop-blur-md sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 border border-blue-100 bg-blue-50 text-lg">
                <AvatarImage
                  src={getAvatarUrl(chatPartner.image, chatPartner.name)}
                  alt={chatPartner.name ?? "Contact"}
                />
                <AvatarFallback>{partnerInitial}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                    {chatPartner.name}
                  </h1>
                  <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Available to chat
                  </span>
                </div>
                {chatPartner.headline && (
                  <p className="text-sm text-slate-500">
                    {chatPartner.headline}
                  </p>
                )}
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {chatPartner.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-full border-slate-200"
                asChild
              >
                <Link href={profileHref}>View profile</Link>
              </Button>
              <Button
                className="rounded-full bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
                asChild
              >
                <Link href={`/${lang}/(protected)/connections`}>
                  Manage connections
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[60vh] flex-1 rounded-3xl border border-white/60 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-3 shadow-lg sm:p-6">
        <MessagingInterface chatId={chatid} chatPartner={friendId} />
      </div>
    </div>
  );
}
