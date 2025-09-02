import { getServerSession } from "next-auth";
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

    // Verify that the users are connected
    await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId, status: 'ACCEPTED' },
          { senderId: friendId, receiverId: userId, status: 'ACCEPTED' }
        ]
      }
    });

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
              <div className="bg-white border-b max-h-full px-6 py-4 mt-16 fixed w-full top-0 ">
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
