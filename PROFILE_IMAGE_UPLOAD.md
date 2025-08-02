# Profile Image Upload Feature

This feature allows users to upload and change their profile pictures on the profile page.

## Features

- **Image Upload**: Users can upload profile images by clicking on the avatar or upload button
- **Image Preview**: Real-time preview of the selected image before upload
- **File Validation**: Validates file type (images only) and size (max 5MB)
- **S3 Storage**: Images are stored securely in AWS S3
- **Database Update**: Profile image URL is updated in the database
- **Remove Image**: Users can remove their profile image
- **Toast Notifications**: Success/error feedback using Sonner toast
- **Responsive Design**: Works on all device sizes

## How It Works

### 1. File Selection
- Users can click on the avatar overlay or the "Upload Photo" button
- File input accepts only image files (JPG, PNG, GIF)
- File size is limited to 5MB

### 2. Upload Process
1. **File Validation**: Checks file type and size
2. **Preview**: Shows image preview immediately
3. **S3 Upload**: Uploads file to AWS S3 with unique filename
4. **Database Update**: Updates user's profile image URL in database
5. **UI Update**: Refreshes the page to show new image

### 3. Remove Image
- Users can click the "Remove" button or the X icon on the avatar
- Clears the image URL from the database
- Updates the UI to show the default avatar

## API Endpoints

### Upload Image
- **POST** `/api/upload`
- Uploads file to S3
- Returns the S3 URL

### Update Profile Image
- **PUT** `/api/user/profile-image`
- Updates user's profile image URL in database
- Requires authentication

## Components

### ProfileImageUpload
- Main component for image upload functionality
- Handles file selection, validation, and upload
- Shows preview and upload status
- Provides remove functionality

### ProfilePageClient
- Client-side wrapper for the profile page
- Handles image upload callbacks
- Manages state updates and page refreshes

## Environment Variables Required

```bash
# AWS S3 Configuration
S3ACCESS_KEY_ID="your_s3_access_key_id"
S3SECRET_ACCESS_KEY="your_s3_secret_access_key"
BUCKET_NAME="your_s3_bucket_name"
```

## File Structure

```
src/
├── components/
│   └── ProfileImageUpload.tsx          # Main upload component
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts               # S3 upload endpoint
│   │   └── user/
│   │       └── profile-image/
│   │           └── route.ts           # Database update endpoint
│   └── [lang]/(protected)/profile/
│       ├── page.tsx                   # Server component
│       └── ProfilePageClient.tsx      # Client component
└── lib/
    └── s3-upload.ts                   # S3 upload utilities
```

## Usage

The profile image upload is automatically available on the profile page at `/profile`. Users can:

1. Click on their avatar or the "Upload Photo" button
2. Select an image file
3. See a preview of the image
4. The image uploads automatically
5. Success/error messages are shown via toast notifications
6. The page refreshes to show the new image

## Error Handling

- **Invalid file type**: Shows error toast
- **File too large**: Shows error toast (max 5MB)
- **Upload failure**: Shows error toast and resets preview
- **Database update failure**: Shows error toast
- **Network errors**: Shows error toast

## Security

- File type validation (images only)
- File size limits (5MB max)
- User authentication required
- S3 bucket permissions configured
- Unique filenames to prevent conflicts 