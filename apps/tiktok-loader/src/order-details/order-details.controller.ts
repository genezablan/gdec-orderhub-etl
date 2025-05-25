import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TransformedOrderDetailsDto } from '@app/contracts/tiktok-transformer/dto/order-details.dto';

import { TiktokOrderService } from '@app/database-orderhub/tiktok_order/tiktok_order.service';
import { TiktokOrderItemService } from '@app/database-orderhub/tiktok_order_item/tiktok_order_item.service';
import { ShopsService } from '@app/database-tiktok/shops/shops.service';

@Controller()
export class OrderDetailsController {
    constructor(
        private tiktokOrderService: TiktokOrderService,
        private tiktokOrderItemService: TiktokOrderItemService
    ) {}

    @MessagePattern('tiktok.transformed_order_details')
    async handleTransformedOrderDetails(
        @Payload() payload: TransformedOrderDetailsDto
    ) {
        console.log(
            '[OrderDetailsController] Received tiktok.transformed_order_details:',
            payload
        );

        if (payload?.orders?.length) {
            for (const order of payload.orders) {
                // Save order
                const savedOrder = await this.tiktokOrderService.create(order);
                // Save items if present
                if (order.items && order.items.length) {
                    for (const item of order.items) {
                        item.orderId = savedOrder.orderId;
                        item.shopId = savedOrder.shopId;
                        await this.tiktokOrderItemService.create(item);
                    }
                }
            }
        }
    }
}
