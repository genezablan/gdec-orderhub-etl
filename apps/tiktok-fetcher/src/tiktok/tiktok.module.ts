import { Module } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import { TiktokController } from './tiktok.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpClientService } from '../http-client/http-client.service';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'TIKTOK_FETCHER_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3001,
                },
            },
        ]),
        ClientsModule.register([
            {
                name: 'TIKTOK_TRANSFORMER_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3002,
                },
            },
        ]),
    ],
    exports: [TiktokService],
    providers: [TiktokService, HttpClientService],
    controllers: [TiktokController],
})
export class TiktokModule {}
