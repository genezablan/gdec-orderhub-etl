import { Controller, Get, Query } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import { GetOrdersQueryDto } from '@app/contracts/tiktok-fetcher/dto/get-orders-query.dto';
import { GetOrderDetailsQueryDto } from '@app/contracts/tiktok-fetcher/dto/get-order-details-query.dt';

@Controller('tiktok')
export class TiktokController {
    constructor(private readonly tiktokService: TiktokService) {}

    @Get('orders')
    getOrders(@Query() query: GetOrdersQueryDto) {
        return this.tiktokService.getOrders({
            shop_id: query.shop_id,
        });
    }

    @Get('orders/details')
    getOrderDetails(@Query() query: GetOrderDetailsQueryDto) {
        const orderDetails = this.tiktokService.getOrderDetails({
            shop_id: query.shop_id,
            order_id: query.order_id,
        });

        return orderDetails;
    }
}
