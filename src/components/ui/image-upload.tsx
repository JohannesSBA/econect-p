"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, Camera } from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface ImageUploadProps {
  currentImage?: string
  onImageUpload: (imageUrl: string) => void
  type: "profile" | "company"
  userId: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export default function ImageUpload({ 
  currentImage, 
  onImageUpload, 
  type, 
  userId, 
  className = "",
  size = "md" 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast("Please select an image file", "error")
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to S3
    uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', `${type}-image`)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      onImageUpload(data.fileUrl)
      showToast("Image uploaded successfully", "success")
    } catch (error) {
      console.error('Error uploading image:', error)
      showToast("Failed to upload image", "error")
      setPreviewImage(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewImage(null)
    onImageUpload("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const displayImage = previewImage || currentImage

  return (
    <div className={`relative inline-block ${className}`}>
      <Avatar className={`${sizeClasses[size]} border-2 border-gray-200`}>
        <AvatarImage 
          src={displayImage || "/placeholder.svg"} 
          alt="Profile image"
        />
        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
          {type === "profile" ? "U" : "C"}
        </AvatarFallback>
      </Avatar>

      {/* Upload overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-full w-full rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity text-white"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <Camera className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Remove button */}
      {displayImage && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveImage}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
} 