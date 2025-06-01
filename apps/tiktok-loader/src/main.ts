import { NestFactory } from '@nestjs/core';
import { TiktokLoaderModule } from './tiktok-loader.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggingService } from '@app/logging';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        TiktokLoaderModule,
        {
            transport: Transport.TCP,
            options: {
                port: 3003,
            },
        }
    );

    // Set up global logging
    const logger = app.get(LoggingService);
    app.useLogger(logger);

    await app.listen();
    logger.log('TikTok Loader Microservice is listening', 'Bootstrap');
}

bootstrap().catch(err => {
    console.error('Error starting the application:', err);
});
