import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";

export default function Header() {
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
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
          <Link href="/auth/login">
            <Button
              variant="outline"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span>Sign in</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
