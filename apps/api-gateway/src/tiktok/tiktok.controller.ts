import { Body, Controller, Get, Post, Query, HttpException, HttpStatus, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import {
    GetOrdersQueryDto,
    GetOrderDetailsQueryDto,
    GetSupportOrderDetailsQueryDto,
    GetSalesInvoicesQueryDto,
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

    @Get('orders/support-details')
    async getSupportOrderDetails(@Query() query: GetSupportOrderDetailsQueryDto) {
        const result = await this.tiktokService.getSupportOrderDetails({
            shop_id: query.shop_id,
            order_id: query.order_id
        });
        
        return result;
    }

    @Get('orders/sales-invoices')
    async getSalesInvoices(@Query() query: GetSalesInvoicesQueryDto) {
        const result = await this.tiktokService.getSalesInvoices({
            shop_id: query.shop_id,
            order_id: query.order_id
        });
        
        return result;
    }

    @Get('shops')
    getShops() {
        return this.tiktokService.getShops();
    }
}
