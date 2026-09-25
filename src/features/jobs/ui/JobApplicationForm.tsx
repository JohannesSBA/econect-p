"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, Send, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"

interface JobApplicationFormProps {
  jobId: string
  userId: string
}

export default function JobApplicationForm({ jobId, userId }: JobApplicationFormProps) {
  const [coverLetter, setCoverLetter] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { showToast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.includes('pdf') && !file.type.includes('doc') && !file.type.includes('docx')) {
      setError("Please upload a PDF, DOC, or DOCX file")
      return
    }
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    setResumeFile(file)
    setError("")
    setIsUploadingResume(true)

    try {
      // Upload to S3
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'resume')
      formData.append('jobId', jobId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload resume')
      }

      const data = await response.json()
      setResumeUrl(data.fileUrl)
      showToast("Resume uploaded successfully", "success")
    } catch (error) {
      console.error('Error uploading resume:', error)
      setError("Failed to upload resume")
      setResumeFile(null)
    } finally {
      setIsUploadingResume(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    if (!resumeUrl) {
      setError("Please upload a resume")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          userId,
          coverLetter,
          resumeUrl
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit application')
      }

      showToast("Application submitted successfully", "success")
      // Refresh the page to show success state
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeResume = () => {
    setResumeFile(null)
    setResumeUrl(null)
    setError("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Resume Upload */}
      <div className="space-y-2">
        <Label htmlFor="resume">Resume/CV *</Label>
        <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                {resumeFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-green-600 font-medium">
                      ✓ {resumeFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeResume}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Upload your resume (PDF, DOC, DOCX - max 5MB)
                  </p>
                )}
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploadingResume}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('resume')?.click()}
                  className="mt-2"
                  disabled={isUploadingResume}
                >
                  {isUploadingResume ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cover Letter */}
      <div className="space-y-2">
        <Label htmlFor="coverLetter">
          Cover Letter <span className="text-gray-500">(Optional)</span>
        </Label>
        <Textarea
          id="coverLetter"
          placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={6}
          className="resize-none"
        />
        <p className="text-xs text-gray-500">
          {coverLetter.length}/2000 characters
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || !resumeUrl}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isSubmitting ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Submitting...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Submit Application</span>
          </div>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        By submitting this application, you agree to our terms of service and privacy policy.
      </p>
    </form>
  )
} 