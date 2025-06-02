import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { TiktokLoaderController } from './tiktok-loader.controller';
import { TiktokLoaderService } from './tiktok-loader.service';
import { OrderDetailsModule } from './order-details/order-details.module';
import { DatabaseOrderhubModule } from '@app/database-orderhub';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        DatabaseOrderhubModule,
        LoggingModule,
        ConfigModule.forRoot({
            envFilePath: ['.env'], // Load from root .env file
            isGlobal: true,
        }),
        OrderDetailsModule,
        ClientsModule.register([
            {
                name: 'TIKTOK_RECEIPT_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3004,
                },
            },
        ]),
    ],
    controllers: [TiktokLoaderController],
    providers: [TiktokLoaderService],
})
export class TiktokLoaderModule {}
