import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { OrderDetailsController } from './order-details.controller';
import {
    TiktokOrderItemService,
    TiktokOrderService,
} from '@app/database-orderhub';
import { DatabaseOrderhubModule } from '@app/database-orderhub';
import { ClientsModule, Transport } from '@nestjs/microservices';
@Module({
    imports: [
        DatabaseOrderhubModule,
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
    controllers: [OrderDetailsController],
    providers: [],
})
export class OrderDetailsModule {}
