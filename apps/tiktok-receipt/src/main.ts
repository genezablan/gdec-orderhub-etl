import { NestFactory } from '@nestjs/core';
import { TiktokReceiptModule } from './tiktok-receipt.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggingService } from '@app/logging';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Ensure environment variables are loaded early
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function bootstrap() {
    // Log environment variables for debugging
    console.log('TikTok Receipt Service starting...');
    console.log('Environment variables loaded:', {
        AWS_REGION: process.env.AWS_REGION,
        AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
        hasAWSCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    });

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        TiktokReceiptModule,
        {
            transport: Transport.TCP,
            options: {
                port: 3004,
            },
        }
    );

    // Set up global logging
    const logger = app.get(LoggingService);
    app.useLogger(logger);

    await app.listen();
    logger.log('TikTok Receipt Microservice is listening on port 3004', 'Bootstrap');
}

bootstrap().catch(err => {
    console.error('Error starting the application:', err);
});
