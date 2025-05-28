import { NestFactory } from '@nestjs/core';
import { TiktokTransformerModule } from './tiktok-transformer.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

const logger = new Logger('TiktokTransformerApp');

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
    await app.listen();
    logger.log('TiktokTransformerApp Microservice is listening');
}
bootstrap();
