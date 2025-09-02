"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, MessageSquare, Heart, Building, MoreHorizontal, Eye, Settings } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export default function NotificationsClient({ lang, initial }: { lang: 'en' | 'am'; initial: Notification[] }) {
  const [items, setItems] = useState<Notification[]>(initial)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ conn: true, social: true, jobs: true, msgs: true })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<any>({})

  useEffect(() => { (async () => {
    const res = await fetch('/api/notifications/settings', { cache: 'no-store' })
    if (res.ok) setSettings(await res.json())
  })() }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return items.filter(n => {
      if (q && !(n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q))) return false
      const t = n.type
      if (!filters.conn && t === 'CONNECTION_REQUEST') return false
      if (!filters.social && (t === 'LIKE' || t === 'COMMENT')) return false
      if (!filters.jobs && (t === 'JOB_INVITATION' || t === 'APPLICATION_UPDATE')) return false
      if (!filters.msgs && t === 'MESSAGE') return false
      return true
    })
  }, [items, query, filters])

  // Keep the unread badge in sync with current state
  useEffect(() => {
    const unread = items.filter(n => !n.read).length
    const el = document.getElementById('notif-unread-badge') as HTMLElement | null
    if (el) el.textContent = String(unread)
  }, [items])

  const getIcon = (type: string) => {
    switch (type) {
      case 'CONNECTION_REQUEST': return <Users className="h-4 w-4 text-blue-600" />
      case 'LIKE': return <Heart className="h-4 w-4 text-red-600" />
      case 'COMMENT': return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'JOB_INVITATION':
      case 'APPLICATION_UPDATE': return <Building className="h-4 w-4 text-purple-600" />
      case 'MESSAGE': return <MessageSquare className="h-4 w-4 text-blue-600" />
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const openTarget = (n: Notification) => {
    const data: any = (n as any).data || {}
    if (n.type === 'MESSAGE') {
      window.location.href = `/${lang}/chat`
      return
    }
    if ((n.type === 'JOB_INVITATION' || n.type === 'APPLICATION_UPDATE') && data.jobId) {
      window.location.href = `/${lang}/jobs/${data.jobId}`
      return
    }
    if (data.postId) {
      // If a dedicated post page exists use it, else fall back to dashboard
      window.location.href = `/${lang}/posts/${data.postId}`
      return
    }
    // Fallback: dashboard
    window.location.href = `/${lang}/dashboard`
  }

  const markAllRead = async () => {
    const res = await fetch('/api/notifications', { method: 'POST' })
    if (res.ok) setItems(prev => prev.map(n => ({ ...n, read: true })))
  }
  const toggleRead = async (id: string, read: boolean) => {
    const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read }) })
    if (res.ok) setItems(prev => prev.map(n => n.id === id ? { ...n, read } : n))
  }
  const removeNotif = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(n => n.id !== id))
  }

  const saveSettings = async () => {
    await fetch('/api/notifications/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setSettingsOpen(false)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search notifications..." className="pl-10 border-gray-200 w-64" value={query} onChange={e=>setQuery(e.target.value)} />
              </div>
              <div className="hidden md:flex items-center space-x-3">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.conn} onChange={e=>setFilters(f=>({ ...f, conn: e.target.checked }))} />Connection requests</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.social} onChange={e=>setFilters(f=>({ ...f, social: e.target.checked }))} />Likes & comments</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.jobs} onChange={e=>setFilters(f=>({ ...f, jobs: e.target.checked }))} />Jobs</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.msgs} onChange={e=>setFilters(f=>({ ...f, msgs: e.target.checked }))} />Messages</label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={()=>setSettingsOpen(true)}><Settings className="h-4 w-4 mr-1" />Settings</Button>
              <Button variant="outline" size="sm" onClick={markAllRead}>Mark all as read</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="space-y-1">
            {filtered.map(n => (
              <div key={n.id} className={`flex items-start space-x-4 p-4 hover:bg-gray-50 ${!n.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                <div className="flex items-start space-x-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to purple-500 text-white">{n.title.split(' ')[0].charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getIcon(n.type)}
                        <h4 className={`font-medium ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h4>
                        {!n.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={()=>openTarget(n)}><Eye className="h-4 w-4 mr-1" />View</Button>
                  <div className="relative group">
                    <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    <div className="absolute right-0 mt-2 hidden group-hover:block bg-white border rounded shadow-md z-10">
                      <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>toggleRead(n.id, !n.read)}>{n.read ? 'Mark as unread' : 'Mark as read'}</button>
                      <button className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={()=>removeNotif(n.id)}>Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Notification Settings</h3>
              <button onClick={()=>setSettingsOpen(false)} className="text-gray-500">✕</button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!settings.emailAll} onChange={e=>setSettings((s:any)=>({ ...s, emailAll: e.target.checked }))} />Email me all notifications</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!settings.emailJob} onChange={e=>setSettings((s:any)=>({ ...s, emailJob: e.target.checked }))} />Email job-related updates</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!settings.pushEnabled} onChange={e=>setSettings((s:any)=>({ ...s, pushEnabled: e.target.checked }))} />Enable browser push</label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={()=>setSettingsOpen(false)}>Cancel</Button>
              <Button onClick={saveSettings}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
