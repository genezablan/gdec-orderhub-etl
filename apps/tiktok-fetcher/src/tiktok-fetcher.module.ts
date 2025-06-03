import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { TiktokFetcherController } from './tiktok-fetcher.controller';
import { TiktokFetcherService } from './tiktok-fetcher.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TiktokService } from './tiktok/tiktok.service';
import { TiktokModule } from './tiktok/tiktok.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpClientService } from './http-client/http-client.service';
import { DatabaseTiktokModule } from '@app/database-tiktok';
import { DatabaseScroogeModule } from '@app/database-scrooge';
import { DatabaseOrderhubModule } from '@app/database-orderhub';
import { HealthService } from '@app/health';

@Module({
    imports: [
        DatabaseTiktokModule,
        DatabaseOrderhubModule,
        LoggingModule,
        ConfigModule.forRoot({
            envFilePath: ['.env'], // Load from root .env file
            isGlobal: true,
        }),
        ClientsModule.register([
            {
                name: 'TIKTOK_TRANSFORMER_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3002,
                },
            },
        ]),
        TiktokModule,
        DatabaseScroogeModule,
    ],

    controllers: [TiktokFetcherController],
    providers: [TiktokFetcherService, TiktokService, HttpClientService, HealthService],
})
export class TiktokFetcherModule {}
