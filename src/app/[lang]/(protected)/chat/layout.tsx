import Link from "next/link"
import Header from "../components/Header"
import { User } from "@/../types/prisma"
import Sidebar from "../components/Sidebar"
import { getCurrentUser } from "@/lib/getCurrentUser"

interface ChatLayoutProps {
  params: { lang: "en" | "am" | "om" }
  children: React.ReactNode
}

export default async function ChatLayout({ params, children }: ChatLayoutProps) {
  const { lang } = params
  const user = (await getCurrentUser()) as unknown as User | null

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-semibold text-slate-900">User not found</h1>
          <p className="mt-2 text-sm text-slate-500">Please sign in with a valid account to continue.</p>
          <Link
            href={`/${lang}/auth/login`}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header user={user} lang={lang} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <main className="flex min-h-[calc(100vh-7rem)] w-full flex-1 flex-col">
          {children}
        </main>
        <aside className="hidden w-72 shrink-0 lg:block">
          <Sidebar user={user} lang={lang} />
        </aside>
      </div>
    </div>
  )
}
