"use client";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Chrome, Phone, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dictionary } from "@/lib/utils"; // Update with actual type
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LoginFormProps {
  dict: Dictionary["login"];
  lang: string;
}

const LoginIllustration = () => (
  <svg
    viewBox="0 0 600 460"
    aria-hidden="true"
    focusable="false"
    className="h-auto w-full max-w-[520px] drop-shadow-xl"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="login-gradient" x1="40" x2="520" y1="60" y2="400" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563EB" />
        <stop offset="0.45" stopColor="#4F46E5" />
        <stop offset="1" stopColor="#9333EA" />
      </linearGradient>
      <linearGradient id="login-accent" x1="0" x2="280" y1="0" y2="260" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EEF2FF" />
        <stop offset="1" stopColor="#DBEAFE" />
      </linearGradient>
      <linearGradient id="login-avatar" x1="0" x2="0" y1="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#1D4ED8" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <rect x="36" y="32" width="528" height="396" rx="48" fill="url(#login-gradient)" opacity="0.14" />
    <rect x="64" y="88" width="480" height="292" rx="28" fill="#ffffff" opacity="0.9" />
    <rect x="96" y="140" width="212" height="160" rx="20" fill="url(#login-accent)" />
    <rect x="332" y="140" width="172" height="120" rx="18" fill="#EEF2FF" />
    <rect x="332" y="276" width="172" height="64" rx="18" fill="#1E293B" opacity="0.08" />
    <circle cx="202" cy="192" r="48" fill="url(#login-avatar)" opacity="0.95" />
    <path
      d="M202 224c-26 0-48 18-52.5 42.3a6 6 0 0 0 5.9 7.1H248.6a6 6 0 0 0 5.9-7.1C250 242 228 224 202 224z"
      fill="#2563EB"
      opacity="0.75"
    />
    <circle cx="162" cy="176" r="8" fill="#BFDBFE" />
    <circle cx="242" cy="176" r="8" fill="#BFDBFE" />
    <rect x="356" y="172" width="124" height="20" rx="10" fill="#1D4ED8" opacity="0.2" />
    <rect x="356" y="205" width="88" height="16" rx="8" fill="#6366F1" opacity="0.2" />
    <circle cx="356" cy="312" r="14" fill="#22D3EE" opacity="0.75" />
    <rect x="384" y="304" width="88" height="16" rx="8" fill="#0EA5E9" opacity="0.25" />
    <path
      d="M468 284c-14.6 0-26.5-11.9-26.5-26.5S453.4 231 468 231s26.5 11.9 26.5 26.5S482.6 284 468 284zm13-27h-10v-10a3 3 0 0 0-3-3h-0.1a3 3 0 0 0-3 3v10h-10a3 3 0 0 0-3 3v0.1a3 3 0 0 0 3 3h10v10a3 3 0 0 0 3 3H468a3 3 0 0 0 3-3v-10h10a3 3 0 0 0 3-3V260a3 3 0 0 0-3-3z"
      fill="#38BDF8"
      opacity="0.85"
    />
    <circle cx="134" cy="112" r="10" fill="#C4B5FD" opacity="0.8" />
    <circle cx="496" cy="122" r="18" fill="#A5B4FC" opacity="0.5" />
    <circle cx="124" cy="320" r="26" fill="#F472B6" opacity="0.3" />
    <rect x="188" y="328" width="168" height="18" rx="9" fill="#F8FAFC" opacity="0.6" />
  </svg>
);

export function LoginForm({ dict, lang }: LoginFormProps) {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function loginWithCredentials(e: FormEvent<HTMLFormElement>) {
    setLoading(true);
    e.preventDefault();

    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: process.env.CALLBACK_URL,
      redirect: false,
    });
    setLoading(false);
    if (!res?.ok) {
      toast.error(res?.error);
      setError(res?.error as string);
      console.log(res?.error);
    }
    if (res?.ok) {
      router.push(`/${lang}/dashboard`);
    }
  }

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-100 via-white to-blue-50" />
      <div className="absolute -top-48 -right-24 -z-10 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute bottom-0 left-[-120px] -z-10 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" />

      <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col-reverse items-center gap-12 px-6 pb-16 pt-12 lg:flex-row lg:items-stretch lg:gap-16">
        <div className="hidden w-full max-w-xl flex-col items-center text-center md:flex lg:items-start lg:text-left">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {dict.welcomeTitle}
            </h1>
            <p className="text-base text-slate-600 sm:text-lg">
              {dict.welcomeSubtitle}
            </p>
          </div>
          <div className="mt-10 w-full max-w-md lg:max-w-full">
            <LoginIllustration />
          </div>
        </div>

        <div className="w-full max-w-lg">
          <Card className="border-0 bg-white/90 shadow-xl backdrop-blur">
            <CardHeader className="space-y-2 pb-4 text-center">
              <CardTitle className="text-2xl font-semibold text-slate-900">
                {dict.signIn}
              </CardTitle>
              <p className="text-sm text-slate-600">{dict.enterCredentials}</p>
            </CardHeader>
            <CardContent className="space-y-7">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:bg-slate-900 hover:text-white hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  type="button"
                >
                  <Chrome className="h-5 w-5" />
                  {dict.continueWithGoogle}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-500">
                    {dict.orContinueWith}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("email")}
                    className={`rounded-xl py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                      loginMethod === "email"
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {dict.email}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("phone")}
                    className={`rounded-xl py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                      loginMethod === "phone"
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {dict.phone}
                  </button>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="credential"
                    className="text-sm font-medium text-slate-700"
                  >
                    {loginMethod === "email" ? dict.email : dict.phone}
                  </Label>
                  <div className="relative">
                    {loginMethod === "email" ? (
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    ) : (
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    )}
                    <Input
                      id="credential"
                      type={loginMethod === "email" ? "email" : "tel"}
                      placeholder={
                        loginMethod === "email"
                          ? dict.emailPlaceholder
                          : dict.phonePlaceholder
                      }
                      className="h-12 rounded-xl border-slate-200 pl-10 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete={loginMethod === "email" ? "email" : "tel"}
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={loginWithCredentials} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    {dict.password}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={dict.passwordPlaceholder}
                      className="h-12 rounded-xl border-slate-200 pl-10 pr-12 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 transition hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Checkbox id="remember" />
                    <Label
                      htmlFor="remember"
                      className="cursor-pointer text-sm font-medium text-slate-600"
                    >
                      {dict.rememberMe}
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    {dict.forgotPassword}
                  </Link>
                </div>

                {error && (
                  <p
                    className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600"
                    aria-live="polite"
                  >
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    dict.signIn
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-slate-600">
                  {dict.noAccount}{" "}
                  <Link
                    href={`/${lang}/auth/register`}
                    className="font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    {dict.createAccount}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              {dict.termsAgreement}{" "}
              <Link
                href="/terms"
                className="font-medium text-blue-600 transition hover:text-blue-700"
              >
                {dict.termsOfService}
              </Link>{" "}
              {dict.and}{" "}
              <Link
                href="/privacy"
                className="font-medium text-blue-600 transition hover:text-blue-700"
              >
                {dict.privacyPolicy}
              </Link>{" "}
              {dict.agree}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
