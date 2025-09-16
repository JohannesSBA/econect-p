import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "../components/Header"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { User } from "@/../types/prisma"
import BlockedListClient from "./BlockedListClient"

export default async function BlockedUsersPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
  const { lang } = await params
  const currentUser = await getCurrentUser() as unknown as User

  // Fetch users this user has blocked
  const blocks = await (prisma as any).userBlock.findMany({
    where: { blockerId: currentUser.id },
    include: {
      blocked: {
        select: { id: true, name: true, image: true, headline: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const blocked = blocks.map((b: any) => b.blocked)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={currentUser} />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Blocked Users</CardTitle>
            </CardHeader>
            <CardContent>
              <BlockedListClient initial={blocked} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

