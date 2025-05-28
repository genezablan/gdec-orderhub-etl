import { NestFactory } from '@nestjs/core';
import { TiktokFetcherModule } from './tiktok-fetcher.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

const logger = new Logger('TiktokFetcherApp');

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
    await app.listen();
    logger.log('TiktokFetcherApp Microservice is listening');
}
bootstrap();
