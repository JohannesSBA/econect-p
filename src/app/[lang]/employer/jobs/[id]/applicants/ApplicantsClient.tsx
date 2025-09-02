"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { socketManager } from "@/lib/socket";

interface ApplicantUser { id: string; name?: string | null; email?: string | null; image?: string | null }
interface Application { id: string; status: string; appliedAt: string; resumeUrl?: string | null; user: ApplicantUser }

export default function ApplicantsClient({ lang, jobId, initialApplications }: { lang: 'en'|'am'|'om'; jobId: string; initialApplications: Application[] }) {
  const [apps, setApps] = useState<Application[]>(initialApplications)
  const [busy, setBusy] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'AI' | 'HUMAN' | 'REJECTED'>('ALL')

  const filtered = useMemo(() => {
    switch (filter) {
      case 'AI':
        return apps.filter(a => a.status === 'AI_APPROVED')
      case 'HUMAN':
        return apps.filter(a => a.status === 'ACCEPTED' || a.status === 'INTERVIEWED' || a.status === 'VIEWED')
      case 'REJECTED':
        return apps.filter(a => a.status === 'REJECTED')
      default:
        return apps
    }
  }, [filter, apps])

  const updateStatus = async (id: string, statusOrCombo: string) => {
    let status = statusOrCombo
    let notify = false
    if (statusOrCombo.includes('|notify')) {
      status = statusOrCombo.split('|')[0]
      notify = true
    }
    setBusy(id)
    try {
      const res = await fetch('/api/jobs/application/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, status, notify })
      })
      if (!res.ok) throw new Error('Failed to update')
      const data = await res.json()
      const updated = data?.application
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: updated?.status || status } : a))
      toast.success(`Application ${status.toLowerCase()}`)
      try { socketManager.emit('application_status', { jobId, applicationId: id, status }) } catch {}
    } catch (e: any) {
      toast.error(e?.message || 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Applicants</h2>
          <Select value={filter} onValueChange={(v:any)=>setFilter(v)}>
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="AI">AI approved</SelectItem>
              <SelectItem value="HUMAN">Human approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" disabled title="Coming soon">
          Review all applicants with AI
        </Button>
      </div>

      <p className="text-xs text-gray-500">Approvals send a notification and email to the applicant.</p>

      <div className="bg-white border rounded-lg divide-y">
        {filtered.map(app => (
          <div key={app.id} className="p-4 flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{app.user?.name || 'Applicant'}</div>
              <div className="text-sm text-gray-600 truncate">{app.user?.email}</div>
              <div className="text-xs mt-1 text-gray-500">Applied {new Date(app.appliedAt).toLocaleDateString()} • Status: {app.status}</div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${lang}/user/${app.user?.id}`} className="text-sm text-blue-600 hover:underline">View profile</Link>
              {app.resumeUrl ? (
                <a className="text-sm text-blue-600 hover:underline" href={app.resumeUrl} target="_blank" rel="noreferrer">Resume</a>
              ) : null}
              <Select onValueChange={(v)=>updateStatus(app.id, v)}>
                <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Change status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPLIED">Mark as Applied</SelectItem>
                  <SelectItem value="VIEWED">Mark as Viewed</SelectItem>
                  <SelectItem value="INTERVIEWED">Interviewed</SelectItem>
                  <SelectItem value="AI_APPROVED">AI Approved</SelectItem>
                  <SelectItem value="ACCEPTED">Accept (Human)</SelectItem>
                  <SelectItem value="REJECTED">Reject</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" disabled={busy===app.id} onClick={()=>updateStatus(app.id, 'ACCEPTED')}>Accept</Button>
              <Button size="sm" variant="destructive" disabled={busy===app.id} onClick={()=>updateStatus(app.id, 'REJECTED')}>Reject</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={busy===app.id} onClick={()=>updateStatus(app.id, app.status + '|notify')}>Send update</Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-6 text-sm text-gray-600">No applicants yet.</div>
        )}
      </div>
    </div>
  )
}
