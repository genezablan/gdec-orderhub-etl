import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TiktokModule } from './tiktok/tiktok.module';
import { ConfigModule } from '@nestjs/config';
import { HealthService } from '@app/health';
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ['.env'], // Load from root .env file
            isGlobal: true,
        }),
        LoggingModule,
        ClientsModule.register([
            {
                name: 'TIKTOK_FETCHER_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3001,
                },
            },
        ]),
        TiktokModule,
    ],
    controllers: [ApiGatewayController],
    providers: [ApiGatewayService, HealthService],
})
export class ApiGatewayModule {}
