import { Body, Controller, Get, Post, Query, HttpException, HttpStatus, BadRequestException, NotFoundException, InternalServerErrorException, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
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

    @Get('download/invoice')
    async downloadInvoice(@Query('file') filePath: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
        try {
            if (!filePath) {
                throw new BadRequestException('File path is required');
            }

            // Validate that the file exists
            if (!existsSync(filePath)) {
                throw new NotFoundException('Invoice file not found');
            }

            // Security check: ensure the file path is pointing to a PDF file
            if (!filePath.toLowerCase().endsWith('.pdf')) {
                throw new BadRequestException('Only PDF files are allowed');
            }

            // Extract filename for the download
            const fileName = filePath.split('/').pop() || 'invoice.pdf';

            // Set response headers
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            });

            // Create and return the file stream
            const file = createReadStream(filePath);
            return new StreamableFile(file);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to download invoice file');
        }
    }

    @Get('shops')
    getShops() {
        return this.tiktokService.getShops();
    }
}
