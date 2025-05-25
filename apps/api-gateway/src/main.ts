import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ValidationPipe, Logger } from '@nestjs/common';

const logger = new Logger('App');

async function bootstrap() {
    const app = await NestFactory.create(ApiGatewayModule);
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
        })
    );
    await app.listen(process.env.port ?? 3000);
}
bootstrap().catch(err => {
    logger.error('Error starting the application:', err);
});
