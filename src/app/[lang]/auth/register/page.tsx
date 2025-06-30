
import Header from '@/components/Header';
import { getDictionary } from '@/app/[lang]/dictionaries';
import { Dictionary } from '@/lib/utils';
import RegisterForm from './register-form';



export default async function RegisterPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
  // Fetch the localized dictionary
    const { lang } = await params
  
    const dict = await getDictionary(lang) as Dictionary

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header with language switch */}
      <Header lang={lang} />

      {/* Client-side registration form */}
      <RegisterForm dict={dict.register} lang={lang} />
    </div>
  );
}