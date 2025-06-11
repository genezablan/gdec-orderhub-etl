import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import { TiktokController } from './tiktok.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
            {
                name: 'TIKTOK_RECEIPT_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3004,
                },
            },
        ]),
    ],
    controllers: [TiktokController],
    providers: [TiktokService],
})
export class TiktokModule {}
