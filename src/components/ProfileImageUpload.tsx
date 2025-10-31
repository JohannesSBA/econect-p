"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Upload, X } from "lucide-react"
import { toast } from "sonner"

interface ProfileImageUploadProps {
  currentImage?: string
  onImageUpload: (imageUrl: string) => void
  userName: string
  className?: string
}

export default function ProfileImageUpload({ 
  currentImage, 
  onImageUpload, 
  userName,
  className = "" 
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to S3
    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setIsUploading(true)

    try {
      // Step 1: Upload to S3
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'profile-image')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const uploadData = await uploadResponse.json()
      const imageUrl = uploadData.fileUrl

      // Step 2: Update user profile in database
      const updateResponse = await fetch('/api/user/profile-image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile')
      }

      // Step 3: Call the callback to update the UI
      onImageUpload(imageUrl)
      toast.success("Profile image updated successfully")
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error("Failed to upload image")
      setPreviewImage(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    try {
      // Update database to remove image
      const updateResponse = await fetch('/api/user/profile-image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: "" }),
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to remove profile image')
      }

      setPreviewImage(null)
      onImageUpload("")
      toast.success("Profile image removed")
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error("Failed to remove image")
    }
  }

  const displayImage = previewImage || currentImage

  return (
    <Card className={`bg-white shadow-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Profile Picture</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-gray-200">
              <AvatarImage 
                src={displayImage || "/placeholder.svg"} 
                alt={`${userName}'s profile picture`}
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Upload overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById('profile-image-input')?.click()}
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
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-2">Update your profile picture</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload a professional photo to make your profile stand out. 
              Supported formats: JPG, PNG, GIF. Max size: 5MB.
            </p>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => document.getElementById('profile-image-input')?.click()}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </>
                )}
              </Button>
              
              {displayImage && (
                <Button
                  variant="outline"
                  onClick={handleRemoveImage}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          id="profile-image-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
} 
