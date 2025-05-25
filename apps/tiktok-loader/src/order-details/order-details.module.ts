import { Module } from '@nestjs/common';
import { OrderDetailsController } from './order-details.controller';
import {
    TiktokOrderItemService,
    TiktokOrderService,
} from '@app/database-orderhub';
import { DatabaseOrderhubModule } from '@app/database-orderhub';
@Module({
    imports: [DatabaseOrderhubModule],
    controllers: [OrderDetailsController],
    providers: [],
})
export class OrderDetailsModule {}
