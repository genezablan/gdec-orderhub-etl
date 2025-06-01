import { NestFactory } from '@nestjs/core';
import { TiktokFetcherModule } from './tiktok-fetcher.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggingService } from '@app/logging';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        TiktokFetcherModule,
        {
            transport: Transport.TCP,
            options: {
                port: 3001,
            },
        }
    );

    // Set up global logging
    const logger = app.get(LoggingService);
    app.useLogger(logger);

    await app.listen();
    logger.log('TikTok Fetcher Microservice is listening', 'Bootstrap');
}

bootstrap().catch(err => {
    console.error('Error starting the application:', err);
});
