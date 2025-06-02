import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import { TiktokController } from './tiktok.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpClientService } from '../http-client/http-client.service';
import { DatabaseTiktokModule } from '@app/database-tiktok';
import { DatabaseScroogeModule } from '@app/database-scrooge';
import { DatabaseOrderhubModule } from '@app/database-orderhub';
@Module({
    imports: [
        DatabaseScroogeModule,
        DatabaseTiktokModule,
        DatabaseOrderhubModule,
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
