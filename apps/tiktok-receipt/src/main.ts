import { NestFactory } from '@nestjs/core';
import { TiktokReceiptModule } from './tiktok-receipt.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggingService } from '@app/logging';

async function bootstrap() {
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
