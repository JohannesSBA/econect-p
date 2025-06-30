// Server Component (src/app/[lang]/auth/login/login-page.tsx)

import Header from '@/components/Header';
import { Dictionary } from '@/lib/utils';
import { getDictionary } from '@/app/[lang]/dictionaries';
import { LoginForm } from './ClientComponent';

export default async function LoginPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
  const { lang } = await params

  const dict = await getDictionary(lang as 'en' | 'am' ) as Dictionary


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header lang={lang} />
      <LoginForm dict={dict.login} lang={lang} />
    </div>
  );
}

// Client Component (src/app/[lang]/auth/login/login-form.tsx)
