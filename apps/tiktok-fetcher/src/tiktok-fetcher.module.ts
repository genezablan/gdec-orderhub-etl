import { Module } from '@nestjs/common';
import { TiktokFetcherController } from './tiktok-fetcher.controller';
import { TiktokFetcherService } from './tiktok-fetcher.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TiktokService } from './tiktok/tiktok.service';
import { TiktokModule } from './tiktok/tiktok.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ['apps/tiktok-fetcher/.env'], // Adjusted path to locate the .env file
            isGlobal: true,
        }),
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

    controllers: [TiktokFetcherController],
    providers: [TiktokFetcherService, TiktokService],
})
export class TiktokFetcherModule {}
