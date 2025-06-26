"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, Eye, Chrome, Phone } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Dictionary } from '@/lib/utils'; // Update with actual type

interface LoginFormProps {
  dict: Dictionary['login'];
  lang: string;
}

export function LoginForm({ dict, lang }: LoginFormProps) {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
      {/* Rest of the login form UI from original component */}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{dict.welcomeTitle}</h1>
          <p className="text-gray-600">{dict.welcomeSubtitle}</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">{dict.signIn}</CardTitle>
            <p className="text-center text-gray-600">{dict.enterCredentials}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full bg-white hover:bg-gray-50 border-gray-200 py-6"
                type="button"
              >
                <Chrome className="mr-2 h-5 w-5" />
                {dict.continueWithGoogle}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">{dict.orContinueWith}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setLoginMethod("email")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    loginMethod === "email" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {dict.email}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod("phone")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    loginMethod === "phone" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {dict.phone}
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credential">
                  {loginMethod === "email" ? dict.email : dict.phone}
                </Label>
                <div className="relative">
                  {loginMethod === "email" ? (
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  ) : (
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  )}
                  <Input
                    id="credential"
                    type={loginMethod === "email" ? "email" : "tel"}
                    placeholder={loginMethod === "email" ? dict.emailPlaceholder : dict.phonePlaceholder}
                    className="pl-10 py-6 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{dict.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={dict.passwordPlaceholder}
                    className="pl-10 pr-10 py-6 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button type="button" className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    {dict.rememberMe}
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  {dict.forgotPassword}
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-medium"
              >
                {dict.signIn}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-gray-600">
                {dict.noAccount}{" "}
                <Link href={`/${lang}/auth/register`} className="text-blue-600 hover:text-blue-700 font-medium">
                  {dict.createAccount}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            {dict.termsAgreement}{" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-700">
              {dict.termsOfService}
            </Link>{" "}
            {dict.and}{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
              {dict.privacyPolicy}
            </Link>
            {" "}
            {dict.agree}
          </p>
        </div>
      </div>
    </div>
  )
}
