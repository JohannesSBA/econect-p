// components/MessagesSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar'
import { Search, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { chatHrefConstructor } from '@/lib/utils'
import { getAvatarUrl } from '@/lib/image-utils'

interface Contact {
  id: string
  name: string
  email: string
  image?: string | null
  headline?: string | null
}

interface Props {
  contacts: Contact[]
  userId: string
  lang: 'en' | 'am'
}

export default function MessagesSidebar({ contacts, lang, userId }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingCount, setPendingCount] = useState<number>(0)
  const pathname = usePathname()
  usePendingRequests(setPendingCount)

  const filtered = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full border-r bg-white">
      {/* search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* contact list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(c => {
          const href = `/${lang}/chat/${chatHrefConstructor(c.id, userId)}`
          const active = pathname === href
          return (
            <Link key={c.id} href={href}>
              <div
                className={`flex items-center p-3 space-x-3 ${
                  active
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getAvatarUrl(c.image, c.name)} alt={c.name} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {c.name
                      .split(' ')
                      .map(w => w[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* requests footer */}
      <div className="p-4 border-t">
        <Link href={`/${lang}/pending-requests`} className="flex items-center space-x-2 w-full hover:bg-gray-50 p-3 rounded">
          <Users className="h-5 w-5 text-gray-600" />
          <span className="font-medium">Requests</span>
          {pendingCount > 0 && <Badge className="ml-auto">{pendingCount}</Badge>}
        </Link>
      </div>
    </div>
  )
}

// Fetch pending count on mount
function usePendingRequests(setCount: (n: number) => void) {
  useEffect(() => {
    let mounted = true
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/connection/pending-count', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setCount(data.count || 0)
      } catch {}
    }
    fetchCount()
    const id = setInterval(fetchCount, 30000) // refresh every 30s
    return () => { mounted = false; clearInterval(id) }
  }, [setCount])
}
