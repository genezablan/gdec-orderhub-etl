import { NestFactory } from '@nestjs/core';
import { TiktokLoaderModule } from './tiktok-loader.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

const logger = new Logger('App');

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
    await app.listen();
    logger.log('Microservice is listening');
}
bootstrap();
