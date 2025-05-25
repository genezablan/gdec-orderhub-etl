import { Module, Logger } from '@nestjs/common';
import { DatabaseOrderhubService } from './database-orderhub.service';
import { TiktokOrderService } from './tiktok_order/tiktok_order.service';
import { TiktokOrderItemService } from './tiktok_order_item/tiktok_order_item.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiktokOrder } from './tiktok_order/tiktok_order.entity';
import { TiktokOrderItem } from './tiktok_order_item/tiktok_order_item.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TiktokOrder, TiktokOrderItem])],
    providers: [
        DatabaseOrderhubService,
        TiktokOrderService,
        TiktokOrderItemService,
    ],
    exports: [
        DatabaseOrderhubService,
        TiktokOrderService,
        TiktokOrderItemService,
    ],
})
export class DatabaseOrderhubModule {}
