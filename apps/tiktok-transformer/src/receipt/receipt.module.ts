import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { ReceiptController } from './receipt.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrderDetailsModule } from '../order-details/order-details.module';

@Module({
    imports: [
        OrderDetailsModule,
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
    controllers: [ReceiptController],
    providers: [ReceiptService],
})
export class ReceiptModule {}
