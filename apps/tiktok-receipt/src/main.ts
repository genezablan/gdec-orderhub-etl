import { NestFactory } from '@nestjs/core';
import { TiktokReceiptModule } from './tiktok-receipt.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

const logger = new Logger('TiktokReceiptApp');

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
    await app.listen();
    logger.log('Tiktok Receipt Microservice is listening to port 3004');
}
bootstrap();
