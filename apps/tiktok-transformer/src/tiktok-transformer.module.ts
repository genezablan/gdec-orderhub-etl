import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { TiktokTransformerController } from './tiktok-transformer.controller';
import { TiktokTransformerService } from './tiktok-transformer.service';
import { ReceiptModule } from './receipt/receipt.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HealthService } from '@app/health';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ['.env'], // Load from root .env file
            isGlobal: true,
        }),
        LoggingModule,
        ReceiptModule,
        ClientsModule.register([
            {
                name: 'TIKTOK_LOADER_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3003,
                },
            },
        ]),
    ],
    controllers: [TiktokTransformerController],
    providers: [TiktokTransformerService, HealthService],
})
export class TiktokTransformerModule {}
