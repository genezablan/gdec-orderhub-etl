import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import {
    GetOrdersQueryDto,
    GetOrderDetailsQueryDto,
} from '@app/contracts/tiktok-fetcher/dto/';
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
            name: query.name,
            full_address: query.full_address,
            tin: query.tin
        });

        return orderDetails;
    }
}
