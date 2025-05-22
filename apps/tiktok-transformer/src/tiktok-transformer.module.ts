import { Module } from '@nestjs/common';
import { TiktokTransformerController } from './tiktok-transformer.controller';
import { TiktokTransformerService } from './tiktok-transformer.service';
import { ReceiptModule } from './receipt/receipt.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
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
    providers: [TiktokTransformerService],
})
export class TiktokTransformerModule {}
