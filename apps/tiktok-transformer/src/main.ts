import { NestFactory } from '@nestjs/core';
import { TiktokTransformerModule } from './tiktok-transformer.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

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
}
bootstrap();
