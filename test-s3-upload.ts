import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testS3Upload() {
    console.log('Testing S3 upload with current configuration...');
    
    const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        },
        forcePathStyle: true,
        maxAttempts: 3
    });
    
    const testBuffer = Buffer.from('Test PDF content for S3 upload');
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'gdec-orderhub-invoices';
    const key = `test/upload-test-${Date.now()}.txt`;
    
    try {
        console.log(`Uploading to bucket: ${bucketName}, key: ${key}`);
        console.log(`Region: ${process.env.AWS_REGION}`);
        console.log(`Has credentials: ${!!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)}`);
        
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: testBuffer,
            ContentType: 'text/plain'
        });

        await s3Client.send(command);
        
        const region = process.env.AWS_REGION || 'us-east-1';
        const s3Url = `https://s3.${region}.amazonaws.com/${bucketName}/${key}`;
        
        console.log(`✅ S3 upload test successful!`);
        console.log(`URL: ${s3Url}`);
        
    } catch (error) {
        console.error('❌ S3 upload test failed:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            statusCode: error.$metadata?.httpStatusCode,
            requestId: error.$metadata?.requestId,
            name: error.name
        });
        
        // Additional debugging info
        if (error.message?.includes('getaddrinfo')) {
            console.error('DNS resolution issue detected. Trying alternative endpoint configurations...');
        }
    }
}

testS3Upload().catch(console.error);
