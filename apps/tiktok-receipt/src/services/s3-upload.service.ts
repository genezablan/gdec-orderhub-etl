import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { LoggingService } from '@app/logging';

export interface S3UploadConfig {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
}

@Injectable()
export class S3UploadService {
    private s3Client: S3Client;
    private readonly config: S3UploadConfig;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: LoggingService
    ) {
        this.config = this.loadS3Config();
        this.initializeS3Client();
    }

    private loadS3Config(): S3UploadConfig {
        return {
            bucketName: this.configService.get<string>('aws.s3.bucketName') || 
                       process.env.AWS_S3_BUCKET_NAME || 
                       'gdec-orderhub-invoices',
            region: this.configService.get<string>('aws.region') || 
                   process.env.AWS_REGION || 
                   'ap-southeast-1',
            accessKeyId: this.configService.get<string>('aws.accessKeyId') || 
                        process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: this.configService.get<string>('aws.secretAccessKey') || 
                           process.env.AWS_SECRET_ACCESS_KEY || ''
        };
    }

    private initializeS3Client(): void {
        this.s3Client = new S3Client({
            region: this.config.region,
            credentials: {
                accessKeyId: this.config.accessKeyId,
                secretAccessKey: this.config.secretAccessKey
            },
            forcePathStyle: true,
            maxAttempts: 3,
            endpoint: `https://s3.${this.config.region}.amazonaws.com`,
            requestHandler: {
                requestTimeout: 30000,
                connectionTimeout: 10000
            }
        });
    }

    async uploadPdf(
        pdfBuffer: Buffer, 
        key: string, 
        bucketName?: string
    ): Promise<string> {
        const targetBucket = bucketName || this.config.bucketName;
        
        const command = new PutObjectCommand({
            Bucket: targetBucket,
            Key: key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ACL: 'private'
        });

        try {
            this.logger.log(
                `Attempting S3 upload to bucket: ${targetBucket}, key: ${key}`, 
                'S3UploadService'
            );
            
            await this.s3Client.send(command);
            
            const s3Url = `https://s3.${this.config.region}.amazonaws.com/${targetBucket}/${key}`;
            
            this.logger.log(`Successfully uploaded to S3: ${s3Url}`, 'S3UploadService');
            return s3Url;
        } catch (error) {
            this.logger.error(
                `Failed to upload file to S3: ${error.message}`, 
                error, 
                'S3UploadService'
            );
            
            // Retry logic for DNS resolution errors
            if (this.isDnsError(error)) {
                return await this.retryUploadWithNewClient(command, targetBucket, key);
            }
            
            throw new Error(`S3 upload failed: ${error.message}`);
        }
    }

    private isDnsError(error: any): boolean {
        return error.message?.includes('getaddrinfo') || 
               error.message?.includes('EAI_AGAIN');
    }

    private async retryUploadWithNewClient(
        command: PutObjectCommand, 
        bucketName: string, 
        key: string
    ): Promise<string> {
        this.logger.log(
            'DNS resolution error detected, attempting retry with new S3 client...', 
            'S3UploadService'
        );
        
        try {
            const retryS3Client = new S3Client({
                region: this.config.region,
                credentials: {
                    accessKeyId: this.config.accessKeyId,
                    secretAccessKey: this.config.secretAccessKey
                },
                forcePathStyle: true,
                maxAttempts: 1,
                retryMode: 'adaptive'
            });

            await retryS3Client.send(command);
            
            const s3Url = `https://s3.${this.config.region}.amazonaws.com/${bucketName}/${key}`;
            
            this.logger.log(`Successfully uploaded to S3 on retry: ${s3Url}`, 'S3UploadService');
            return s3Url;
        } catch (retryError) {
            this.logger.error(
                `Retry also failed: ${retryError.message}`, 
                retryError, 
                'S3UploadService'
            );
            throw new Error(`S3 upload failed even after retry: ${retryError.message}`);
        }
    }

    generateS3Key(
        shopId: string, 
        orderId: string, 
        packageId: string, 
        sequenceNumber: string
    ): string {
        const stage = process.env.NODE_ENV || 'development';
        return `${stage}/invoices/tiktok/${shopId}/${orderId}/${packageId}/${sequenceNumber}.pdf`;
    }

    /**
     * Generate S3 key with timestamp for reprints
     */
    generateS3KeyWithTimestamp(
        shopId: string, 
        orderId: string, 
        packageId: string, 
        sequenceNumber: string,
        timestamp: string
    ): string {
        const stage = process.env.NODE_ENV || 'development';
        return `${stage}/invoices/tiktok/${shopId}/${orderId}/${packageId}/${sequenceNumber}_reprint_${timestamp}.pdf`;
    }
}
