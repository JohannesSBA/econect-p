
import Header from "../components/Header";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { User } from "@/../types/prisma";
import Sidebar from "../components/Sidebar";
import { ConnectionsList } from "../components/ConnectionList";

export default async function ConnectsPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
    const { lang } = await params
    const user = await getCurrentUser() as unknown as User
    return (
        <div>
            <Header lang={lang} user={user} />
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <ConnectionsList lang={lang} userId = {user.id} friends={user.friends} />
                    </div>
                    <div className="lg:col-span-1">
                        <Sidebar user={user} lang={lang} />
                    </div>
                </div>
            </div>
        </div>
    )
}