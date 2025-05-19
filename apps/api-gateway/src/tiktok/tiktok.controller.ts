import { Controller, Get, Query } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
@Controller('tiktok')
export class TiktokController {
    constructor(private readonly tiktokService: TiktokService) {}

    @Get('orders')
    getOrders(@Query('shop_id') shop_id: string) {
        return this.tiktokService.getOrders({
            shop_id,
        });
    }

    @Get('orders/details')
    getOrderDetails(
        @Query('shop_id') shop_id: string,
        @Query('order_id') order_id: string
    ) {
        const orderDetails = this.tiktokService.getOrderDetails({
            shop_id,
            order_id,
        });

        return orderDetails;
    }
}
