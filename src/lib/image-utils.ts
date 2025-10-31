export function getImageUrl(imageUrl?: string | null, fallback?: string): string {
  if (!imageUrl) {
    return fallback || "/placeholder.svg"
  }

  // If it's already a full URL (starts with http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // If it's an S3 key, construct the full URL using public env
  if (imageUrl.includes('/') && !imageUrl.startsWith('http')) {
    const bucket = (process.env.NEXT_PUBLIC_S3_BUCKET || "").trim()
    const region = (process.env.NEXT_PUBLIC_S3_REGION || 'us-east-1').trim()
    if (bucket) return `https://${bucket}.s3.${region}.amazonaws.com/${imageUrl}`
  }

  // Fallback to placeholder
  return fallback || "/placeholder.svg"
}

export function getAvatarUrl(userImage?: string | null, _userName?: string): string {
  if (!userImage) {
    return "/placeholder.svg"
  }

  return getImageUrl(userImage, "/placeholder.svg")
}

export function getCompanyLogoUrl(companyImage?: string | null, _companyName?: string): string {
  if (!companyImage) {
    return "/placeholder.svg"
  }

  return getImageUrl(companyImage, "/placeholder.svg")
}

export function getResumeUrl(resumeUrl?: string | null): string | null {
  if (!resumeUrl) {
    return null
  }

  return getImageUrl(resumeUrl, "")
} 
