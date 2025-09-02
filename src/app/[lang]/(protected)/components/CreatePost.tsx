"use client"

import { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ImageIcon,
  Link as LinkIcon,
  Video,
  Calendar,
  Globe,
  Send,
  Smile,
  Pencil,
} from "lucide-react"
import { User } from "@/../types/prisma"
import { getAvatarUrl } from "@/lib/image-utils"
import { socketManager } from "@/lib/socket"

interface CreatePostProps {
  user: User
}

export function CreatePost({ user }: CreatePostProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content: content.trim(),
          type: images.length > 0 ? "IMAGE" : "TEXT",
          images,
        }),
      })

      if (response.ok) {
        const body = await response.json().catch(() => null as any)
        const created = body?.post
        setTitle("")
        setContent("")
        setImages([])
        setIsExpanded(false)
        // Broadcast new post to other clients (real-time feed)
        try {
          if (created) {
            socketManager.emit('new_post', { post: created })
          }
        } catch {}
      }
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const handlePickImages = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const remainingSlots = 3 - images.length
    const toUpload = files.slice(0, remainingSlots)
    if (toUpload.length === 0) return
    setIsUploading(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of toUpload) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 5 * 1024 * 1024) continue
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'post-image')
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Upload failed')
        const data = await res.json()
        if (data?.fileUrl) uploadedUrls.push(data.fileUrl)
      }
      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls].slice(0, 3))
      }
    } catch (err) {
      console.error('Failed uploading images', err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-end justify-end">
          <Pencil className="h-4 w-4" />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getAvatarUrl((user as any)?.image, user?.name)} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">{user.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
              </div>
              <Textarea
                placeholder="What do you want to talk about?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                className="min-h-[60px] border-1 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
                rows={isExpanded ? 3 : 2}
              />
              
              {isExpanded && (
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    placeholder="Add a title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((url, idx) => (
                        <div key={idx} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="upload" className="w-full h-24 object-cover rounded" />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Privacy selector */}
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Anyone</span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                        onClick={handlePickImages}
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Media
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFilesSelected}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Link
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Video
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Event
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Smile className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={!content.trim() || isUploading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {isUploading ? 'Uploading...' : 'Post'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 
