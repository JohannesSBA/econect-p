import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { Dictionary } from "@/lib/utils";
import { Languages, ArrowRight } from "lucide-react";

interface HeaderProps {
  lang: string;
}

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "om", label: "Afaan Oromo", native: "Oromoo" },
];

export default async function Header({ lang }: HeaderProps) {
  const dict = (await getDictionary(lang as "en" | "am")) as Dictionary;

  const navLinks = [
    { href: "/", label: dict?.header?.home ?? "Home" },
    { href: "#features", label: dict?.header?.features ?? "Features" },
    { href: "#pricing", label: dict?.header?.pricing ?? "Pricing" },
    { href: "#about", label: dict?.header?.about ?? "About" },
    { href: "#contact", label: dict?.header?.contact ?? "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 h-20 border-b border-white/60 bg-white/80 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-lg transition-colors duration-500">
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group relative inline-flex items-center rounded-full p-2 transition-all duration-300 hover:-translate-y-0.5"
            aria-label="Econnect home"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 blur transition-opacity duration-300 group-hover:opacity-20" />
            <Image
              src="/logoWName.png"
              alt="Econnect"
              width={140}
              height={40}
              priority
              className="relative h-auto w-[120px] sm:w-[140px]"
            />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900"
              >
                <span className="absolute inset-0 scale-95 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                <span className="relative">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <Languages className="h-4 w-4 text-blue-500 transition group-hover:rotate-6" />
                <span>{`${dict?.language ?? "Language"}: ${lang?.toUpperCase() || ""}`}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border border-slate-100 bg-white/95 shadow-xl backdrop-blur">
              <DropdownMenuLabel className="text-xs font-semibold uppercase text-slate-400">
                {dict?.header?.chooseLanguage ?? "Choose language"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGUAGES.map((option) => (
                <DropdownMenuItem key={option.code} asChild>
                  <Link
                    href={`/${option.code}`}
                    locale={option.code}
                    className="group flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-blue-50"
                  >
                    <span>{option.native}</span>
                    {option.code === lang ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                        {dict?.header?.current ?? "Current"}
                      </span>
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="hidden h-6 bg-slate-200 sm:block" />

          <Link href={`/${lang}/auth/login`}>
            <Button
              variant="outline"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span>{dict?.header?.login ?? "Sign in"}</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
