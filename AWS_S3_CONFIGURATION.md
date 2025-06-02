# AWS S3 Configuration for TikTok Receipt Generation

## Overview
The TikTok Receipt service now supports uploading generated PDF invoices to AWS S3 for better storage management and accessibility.

## Required Environment Variables

Add the following environment variables to your `.env` file or deployment environment:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET_NAME=gdec-orderhub-invoices
```

## Environment Variable Descriptions

- **AWS_REGION**: The AWS region where your S3 bucket is located (default: `us-east-1`)
- **AWS_ACCESS_KEY_ID**: Your AWS access key ID with S3 permissions
- **AWS_SECRET_ACCESS_KEY**: Your AWS secret access key
- **AWS_S3_BUCKET_NAME**: The name of the S3 bucket where invoices will be stored (default: `gdec-orderhub-invoices`)

## S3 Bucket Setup

1. **Create an S3 bucket** in your AWS account
2. **Set appropriate permissions** for the bucket
3. **Create an IAM user** with the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name"
        }
    ]
}
```

## File Storage Structure

Invoices are stored in S3 with the following path structure:
```
invoices/tiktok/{shopId}/{orderId}/{packageId}/{sequenceNumber}.pdf
```

Example:
```
invoices/tiktok/shop123/order456/pkg789/12345.pdf
```

## Implementation Details

### Upload Process
1. PDF invoice is generated directly as a Buffer in memory
2. Buffer is uploaded directly to S3 using AWS SDK v3
3. S3 URL is stored in the database
4. No local files are created or need cleanup

### Benefits of Direct Upload
- **Improved Performance**: No disk I/O operations for temporary files
- **Better Resource Management**: No local file cleanup required
- **Simplified Error Handling**: Single point of failure (S3 upload)
- **Reduced Storage**: No temporary files consuming local disk space

### Error Handling
- If S3 upload fails, the entire invoice generation process fails
- This ensures data consistency and prevents orphaned records
- Errors are logged with detailed information for debugging

### Database Storage
- The `filePath` field in the sales invoice table stores the S3 URL
- Format: `https://bucket-name.s3.region.amazonaws.com/invoices/...`
- No local file paths are stored since files are uploaded directly to S3

## Security Considerations

1. **Bucket Access**: Set the bucket ACL to `private` for security
2. **IAM Permissions**: Use least-privilege principle for IAM user permissions
3. **Environment Variables**: Keep AWS credentials secure and never commit them to version control
4. **File Access**: Consider implementing pre-signed URLs for secure file access if needed

## Monitoring and Logging

The system logs the following events:
- Successful S3 uploads with URLs
- S3 upload failures with error details
- PDF generation completion with buffer size
- Invoice generation process start and completion

## Testing

To test the S3 integration:
1. Set up the required environment variables
2. Generate a test invoice through the API
3. Verify the file appears in your S3 bucket
4. Check that the database contains the S3 URL
