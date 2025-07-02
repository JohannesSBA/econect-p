"use client"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  MessageCircle,
  Briefcase,
  Link2,
  Search,
  Bell,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import Signout from "./Signout"
import { User } from "@/../types/prisma"
interface HeaderProps {
  lang: string;
  user: User
}

export default function Header({ lang, user }: HeaderProps) {
    const pathname = usePathname()

     return(
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Image src="/icon1.png" alt="Econnect" width={32} height={32} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Econnect
            </span>
          </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8 ">
              <Link
                href={`/${lang}/dashboard`}
                className={`flex flex-col items-center space-y-1 hover:text-blue-600  ${pathname.includes('dashboard') ? ' pb-4 border-b-2 border-blue-600 text-blue-600' : ''}`}
              >
                <Home className="h-3 w-3" />
                <span className="text-xs ">Dashboard</span>
              </Link>
              <Link
                href={`/${lang}/messaging`}
                className={`flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 ${pathname.includes('messaging') ? ' pb-4 border-b-2 border-blue-600 text-blue-600' : ''}`}
              >
                <div className="relative">
                  <MessageCircle className="h-3 w-3" />
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 bg-blue-600 text-white text-xs flex items-center justify-center">
                    1
                  </Badge>
                </div>
                <span className="text-xs">Messaging</span>
              </Link>
              <Link
                href={`/${lang}/listings`}
                className={`flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 ${pathname.includes('listings') ? ' pb-4 border-b-2 border-blue-600 text-blue-600' : ''}`}
              >
                <Briefcase className="h-3 w-3" />
                <span className="text-xs">Listings</span>
              </Link>
              <Link
                href={`/${lang}/connects`}
                className={`flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 ${pathname.includes('connects') ? ' pb-4 border-b-2 border-blue-600 text-blue-600' : ''}`}
              >
                <Link2 className="h-3 w-3" />
                <span className="text-xs">Connects</span>
              </Link>
            </nav>

            {/* Search and Profile */}
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  className="pl-10 w-64 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <Bell className="h-3 w-3 text-gray-600" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-blue-600 text-white text-xs flex items-center justify-center">
                  9
                </Badge>
              </div>
              <Link href={`/${lang}/profile`} className="flex items-center space-x-3 hover:bg-gray-100/90 rounded-md p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>JB</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-blue-600">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </Link>
              <Signout />
            </div>
          </div>
        </div>
      </header> 
     )    
}