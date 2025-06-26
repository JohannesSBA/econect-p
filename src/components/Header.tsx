import Link from "next/link";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import Image from "next/image";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { Dictionary } from "@/lib/utils";

interface HeaderProps {
  lang: string;
}

export default async function Header({ lang }: HeaderProps) {

  const dict = await getDictionary(lang as 'en' | 'am' | 'om') as Dictionary
    
     return(
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Image src="/icon1.png" alt="Econnect" width={32} height={32} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Econnect
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-3 text-black text-xs font-bold hover:bg-gray-100 bg-white border border-gray-200 rounded-md">
                {`${dict?.language || ''}: ${lang?.toUpperCase() || ''}`}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white text-black">
                <DropdownMenuItem asChild>
                  <Link href="/en" className="w-full justify-start" locale="en">
                    <Button variant="default" className="px-3 w-full text-start">
                      English (EN)
                    </Button>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/am" className="w-full justify-start" locale="am">
                    <Button variant="default" className="px-3 w-full text-start">
                      አማርኛ (AM)
                    </Button>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/om" className="w-full justify-start" locale="om">
                    <Button variant="default" className="px-3 w-full text-start">
                      Oromoo (OM)
                    </Button>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/login">
              <Button variant="outline" className="bg-white text-blue-600 cursor-pointer border-blue-200 hover:bg-blue-50">
                {dict?.header?.login}
              </Button>
            </Link>
          </div>
        </div>
      </header> 
     )    
}