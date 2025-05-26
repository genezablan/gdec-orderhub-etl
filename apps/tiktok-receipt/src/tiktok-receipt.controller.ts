import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TiktokOrderService } from '@app/database-orderhub';

@Controller()
export class TiktokReceiptController {
    constructor(private readonly tiktokOrderService: TiktokOrderService) {}

    @MessagePattern('tiktok.order_loaded')
    async handleOrderLoaded(payload: any) {
        // Handle the order loaded event
        console.log('Received tiktok.order_loaded:', payload);
        // Call service to fetch order with items
        const orderWithItems = await this.tiktokOrderService.findOrderWithItems(
            payload.orderId,
            payload.shopId
        );
        if (orderWithItems && orderWithItems.items) {
            // Aggregate items by shopId, orderId, productId and add quantity
            const aggregated = Object.values(
                orderWithItems.items.reduce(
                    (acc, item) => {
                        const key = `${item.shopId}|${item.orderId}|${item.productId}`;
                        if (!acc[key]) {
                            acc[key] = { ...item, quantity: 1 };
                        } else {
                            acc[key].quantity += 1;
                        }
                        return acc;
                    },
                    {} as Record<
                        string,
                        (typeof orderWithItems.items)[0] & { quantity: number }
                    >
                )
            ) as typeof orderWithItems.items;
            orderWithItems.items = aggregated;
            console.log('Aggregated items:', aggregated);
            // You can add your business logic here
        }
    }
}
