# S3 Setup Guide

This application uses AWS S3 for file uploads including:
- User profile images
- Company logos
- Resume uploads
- Cover letters

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# AWS S3 Configuration
S3ACCESS_KEY_ID="your_s3_access_key_id"
S3SECRET_ACCESS_KEY="your_s3_secret_access_key"
BUCKET_NAME="your_s3_bucket_name"
```

## AWS S3 Setup

1. **Create an S3 Bucket:**
   - Go to AWS S3 Console
   - Create a new bucket with a unique name
   - Choose your preferred region (default: us-east-1)
   - Configure bucket settings as needed

2. **Create IAM User:**
   - Go to AWS IAM Console
   - Create a new user for S3 access
   - Attach the `AmazonS3FullAccess` policy (or create a custom policy with minimal permissions)
   - Generate access keys for the user

3. **Bucket Permissions:**
   - Ensure your bucket allows public read access for images
   - Configure CORS if needed for cross-origin requests

## File Structure in S3

The application organizes files in the following structure:

```
your-bucket/
├── profile-images/
│   └── user-id/
│       └── timestamp-filename.jpg
├── company-images/
│   └── user-id/
│       └── timestamp-filename.jpg
├── resumes/
│   └── user-id/
│       └── job-id/
│           └── timestamp-filename.pdf
└── cover-letters/
    └── user-id/
        └── job-id/
            └── timestamp-filename.pdf
```

## Security Considerations

1. **IAM Permissions:** Use the principle of least privilege
2. **Bucket Policy:** Configure appropriate bucket policies
3. **CORS:** Set up CORS if needed for your domain
4. **File Validation:** The application validates file types and sizes
5. **Access Control:** Files are organized by user ID for access control

## Usage

The application automatically handles:
- File uploads to S3
- URL generation for images
- Fallback to placeholder images
- File type validation
- File size limits (5MB for images, 5MB for documents)

## Troubleshooting

1. **Upload Failures:** Check IAM permissions and bucket configuration
2. **Image Not Loading:** Verify bucket is public or configure proper access
3. **CORS Errors:** Configure CORS policy for your domain
4. **Environment Variables:** Ensure all required variables are set 