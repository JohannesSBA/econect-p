"use client"

import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAvatarUrl } from "@/lib/image-utils"

interface BlockedUser {
  id: string
  name: string
  image?: string | null
  headline?: string | null
}

export default function BlockedListClient({ initial }: { initial: BlockedUser[] }) {
  const [list, setList] = useState(initial)
  const [pending, start] = useTransition()

  const unblock = (userId: string) => {
    start(async () => {
      try {
        await fetch('/api/user/block', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        setList(prev => prev.filter(u => u.id !== userId))
      } catch {}
    })
  }

  if (list.length === 0) {
    return <p className="text-sm text-gray-600">You haven’t blocked anyone.</p>
  }

  return (
    <div className="space-y-3">
      {list.map(u => (
        <div key={u.id} className="flex items-center justify-between p-3 border rounded-md">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={getAvatarUrl(u.image, u.name)} />
              <AvatarFallback>{u.name.slice(0,1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{u.name}</p>
              {u.headline && <p className="text-xs text-gray-500 truncate">{u.headline}</p>}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => unblock(u.id)} disabled={pending}>
            {pending ? 'Unblocking…' : 'Unblock'}
          </Button>
        </div>
      ))}
    </div>
  )
}

