import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingService } from '@app/logging';
import { AllExceptionsFilter } from './all-exceptions.filter';

async function bootstrap() {
    const app = await NestFactory.create(ApiGatewayModule);
    
    // Enable CORS for web interface
    app.enableCors({
        origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:8000', 'http://127.0.0.1:8000','http://master.d2gn6xxesc0itl.amplifyapp.com'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    
    // Set up global logging
    const logger = app.get(LoggingService);
    app.useLogger(logger);

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            exceptionFactory: (errors) => {
                const messages = errors.map(error => 
                    Object.values(error.constraints || {}).join(', ')
                ).join('; ');
                return new ValidationPipe().createExceptionFactory()(errors);
            }
        })
    );

    // Add global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());
    
    const port = process.env.port ?? 3000;
    await app.listen(port);
    logger.log(`API Gateway is running on port ${port}`, 'Bootstrap');
}

bootstrap().catch(err => {
    console.error('Error starting the application:', err);
});
