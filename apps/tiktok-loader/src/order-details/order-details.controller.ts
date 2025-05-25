import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TransformedOrderDetailsDto } from '@app/contracts/tiktok-transformer/dto/order-details.dto';

import { TiktokOrderService } from '@app/database-orderhub/tiktok_order/tiktok_order.service';
import { TiktokOrderItemService } from '@app/database-orderhub/tiktok_order_item/tiktok_order_item.service';
import { ShopsService } from '@app/database-tiktok/shops/shops.service';

@Controller()
export class OrderDetailsController {
    private readonly logger = new Logger(OrderDetailsController.name);
    constructor(
        private tiktokOrderService: TiktokOrderService,
        private tiktokOrderItemService: TiktokOrderItemService
    ) {}

    @MessagePattern('tiktok.transformed_order_details')
    async handleTransformedOrderDetails(
        @Payload() payload: TransformedOrderDetailsDto
    ) {
        this.logger.log(
            `[OrderDetailsController] Received tiktok.transformed_order_details: ${JSON.stringify(payload)}`
        );

        if (payload?.orders?.length) {
            for (const order of payload.orders) {
                // Upsert order: only update fields that are null, always update updatedAt
                const whereOrder = {
                    orderId: order.orderId,
                    shopId: order.shopId,
                };
                const updateOrder = { ...order, updatedAt: new Date() };
                const existingOrder =
                    await this.tiktokOrderService.findOne(whereOrder);
                if (existingOrder) {
                    // Only update fields that are null in the existing order
                    for (const key of Object.keys(updateOrder)) {
                        if (
                            existingOrder[key] !== null &&
                            key !== 'updatedAt'
                        ) {
                            delete updateOrder[key];
                        }
                    }
                    updateOrder.updatedAt = new Date();
                }
                const savedOrder = await this.tiktokOrderService.upsert(
                    whereOrder,
                    updateOrder
                );
                // Save items if present
                if (order.items && order.items.length) {
                    for (const item of order.items) {
                        const whereItem = {
                            lineItemId: item.lineItemId,
                            orderId: item.orderId,
                            shopId: item.shopId,
                        };
                        const updateItem = { ...item, updatedAt: new Date() };
                        const existingItem =
                            await this.tiktokOrderItemService.findOne(
                                whereItem
                            );
                        if (existingItem) {
                            for (const key of Object.keys(updateItem)) {
                                if (
                                    existingItem[key] !== null &&
                                    key !== 'updatedAt'
                                ) {
                                    delete updateItem[key];
                                }
                            }
                            updateItem.updatedAt = new Date();
                        }
                        await this.tiktokOrderItemService.upsert(
                            whereItem,
                            updateItem
                        );
                    }
                }
            }
        }
    }
}
