
import Header from "@/components/Header"
import { getDictionary } from "@/app/[lang]/dictionaries"
import { Dictionary } from "@/lib/utils"
import RegisterForm from "./register-form"

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: "en" | "am" }>
}) {
  const { lang } = await params
  const dict = (await getDictionary(lang)) as Dictionary

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="pointer-events-none absolute -right-24 top-[-140px] h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-180px] left-[-120px] h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" />

      <Header lang={lang} />

      <main className="mx-auto flex h-[calc(100vh-72px)] w-full max-w-7xl items-center px-4 py-6 sm:h-[calc(100vh-80px)] sm:px-8 lg:px-12">
        <RegisterForm dict={dict.register} lang={lang} />
      </main>
    </div>
  )
}
