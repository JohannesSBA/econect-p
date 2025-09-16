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
  const dict = await getDictionary(lang as 'en' | 'am' ) as Dictionary

    
     return(
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 h-20">
        <div className="container mx-auto px-4  flex items-start justify-between">

            <Link href="/" className="h-full w-fit p-0  ">
              <Image src="/logoWName.png" alt="Econnect" width={120} height={120} />
            </Link>
            

          
          <div className="flex items-center space-x-4 py-4">
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

            <Link href={`/${lang}/auth/login`}>
              <Button variant="outline" className="bg-white text-blue-600 cursor-pointer border-blue-200 hover:bg-blue-50">
                {dict?.header?.login}
              </Button>
            </Link>
          </div>
        </div>
      </header> 
     )    
}