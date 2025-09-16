import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { notFound } from "next/navigation";
import MessagingInterface from "../../components/MessagingInterface";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { User } from "@/../types/prisma";
import prisma from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/image-utils";

interface ChatPageProps {
  params: Promise<{ lang: string; chatid: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
    const { chatid } = await params;
    const session = await getServerSession(authOptions);
    if (!session) notFound();

    const user = await getCurrentUser() as unknown as User;
    if (!user) notFound();

    const [id1, id2] = chatid.split("--");
    if (!id1 || !id2) notFound();

    const userId = session.user.id;
    const friendId = userId === id1 ? id2 : id1;
    console.log("userId", userId)
    console.log("friendId", friendId)

    // Verify access: allow if connected OR either user is employer/recruiter/admin OR there is a message request between them
    // Block if either direction has been blocked
    const blocked = await (prisma as any).userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: friendId },
          { blockerId: friendId, blockedId: userId },
        ]
      },
      select: { id: true }
    })
    console.log("blocked", blocked)
    if (blocked) notFound()

    const self = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    const partner = await prisma.user.findUnique({ where: { id: friendId }, select: { role: true } })
    const eitherEmployer = ['EMPLOYER','RECRUITER','ADMIN'].includes((self?.role as any)) || ['EMPLOYER','RECRUITER','ADMIN'].includes((partner?.role as any))

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId, status: 'ACCEPTED' },
          { senderId: friendId, receiverId: userId, status: 'ACCEPTED' }
        ]
      }
    })
    console.log("connection", connection)

    // Check if a message request exists in either direction (PENDING or ACCEPTED)
    let hasMessageRequest = false
    try {
      const req = await (prisma as any).messageRequest.findFirst({
        where: {
          OR: [
            { senderId: userId, recipientId: friendId },
            { senderId: friendId, recipientId: userId },
          ]
        },
        select: { id: true }
      })
      hasMessageRequest = Boolean(req)
    } catch {}

    let hasMessages = false
    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: friendId },
            { senderId: friendId, recipientId: userId },
          ]
        }
      })
      hasMessages = messages.length > 0
    } catch {
      hasMessages = false
    }
    console.log("hasMessages", hasMessages)

    if (!connection && !eitherEmployer && !hasMessageRequest && !hasMessages) {
      // If not connected, not employer conversation, and no message request, block access
      notFound()
    }

    // Get the chat partner's information
    const chatPartner = await prisma.user.findUnique({
      where: { id: friendId },
      select: {
        id: true,
        name: true,
        image: true,
        headline: true,
        email: true,
      }
    });

    if (!chatPartner) notFound();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <div className="flex-1 flex">
            {/* Chat Interface */}
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="bg-white border-b px-6 py-4 sticky top-0 z-30">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={getAvatarUrl(chatPartner.image, chatPartner.name)} />
                    <AvatarFallback>{(chatPartner.name || 'U').slice(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900">{chatPartner.name}</h2>
                    <p className="text-sm text-gray-500">{chatPartner.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <MessagingInterface chatId={chatid} chatPartner={friendId} />
              </div>
            </div>
          </div>
        </div>
    );
}
