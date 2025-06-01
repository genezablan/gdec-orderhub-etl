import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingService } from '@app/logging';

async function bootstrap() {
    const app = await NestFactory.create(ApiGatewayModule);
    
    // Set up global logging
    const logger = app.get(LoggingService);
    app.useLogger(logger);

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
        })
    );
    
    const port = process.env.port ?? 3000;
    await app.listen(port);
    logger.log(`API Gateway is running on port ${port}`, 'Bootstrap');
}

bootstrap().catch(err => {
    console.error('Error starting the application:', err);
});
