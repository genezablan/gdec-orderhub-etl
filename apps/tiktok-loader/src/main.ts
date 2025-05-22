import { NestFactory } from '@nestjs/core';
import { TiktokLoaderModule } from './tiktok-loader.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

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
}
bootstrap();
