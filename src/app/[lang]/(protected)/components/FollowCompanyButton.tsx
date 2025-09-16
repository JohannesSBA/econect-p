"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"

export default function FollowCompanyButton({
  companyId,
  initiallyFollowing,
}: { companyId: string; initiallyFollowing: boolean }) {
  const [following, setFollowing] = useState(initiallyFollowing)
  const [pending, start] = useTransition()

  const toggle = () => {
    start(async () => {
      try {
        const method = following ? "DELETE" : "POST"
        const res = await fetch(`/api/company/${companyId}/follow`, { method })
        if (res.ok) setFollowing(!following)
      } catch {}
    })
  }

  return (
    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={toggle} disabled={pending}>
      {pending ? (following ? "Unfollowing…" : "Following…") : (following ? "Following" : "Follow Company")}
    </Button>
  )
}

