import { NestFactory } from '@nestjs/core';
import { TiktokTransformerModule } from './tiktok-transformer.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggingService } from '@app/logging';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        TiktokTransformerModule,
        {
            transport: Transport.TCP,
            options: {
                port: 3002,
            },
        }
    );

    // Set up global logging
    const logger = app.get(LoggingService);
    app.useLogger(logger);

    await app.listen();
    logger.log('TikTok Transformer Microservice is listening', 'Bootstrap');
}

bootstrap().catch(err => {
    console.error('Error starting the application:', err);
});
