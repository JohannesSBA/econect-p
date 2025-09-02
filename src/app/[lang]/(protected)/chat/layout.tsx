import Header from "../components/Header"
import { User } from "@/../types/prisma"
import Sidebar from "../components/Sidebar"
import { getCurrentUser } from "@/lib/getCurrentUser"

export default async function ChatLayout({ params, children }: { params: Promise<{ lang: 'en' | 'am' }>, children: React.ReactNode }) {
    const { lang } = await params
    const user = await getCurrentUser() as unknown as User

    // Handle case where user is not found
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
            <p className="text-gray-600 mb-4">Please log in with a valid account.</p>
            <a href={`/${lang}/auth/login`} className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Go to Login
            </a>
          </div>
        </div>
      )
    }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} lang={lang} />
      <div className="flex flex-1">
        <div className="flex-1 flex flex-col">
            {children}
        </div>
        <div className="md:flex hidden z-100">
          <Sidebar user={user} lang={lang} />
        </div>
      </div>
    </div>
  )
}
