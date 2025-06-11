import { BadRequestException, Controller, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { MessagePattern, ClientProxy, RpcException } from '@nestjs/microservices';
import { TiktokService } from './tiktok.service';
import { SimpleDeduplicationService } from './simple-deduplication.service';
import { TIKTOK_FETCHER_PATTERNS } from '@app/contracts/tiktok-fetcher/tiktok-fetcher.patterns';
import { ShopsService } from '@app/database-tiktok/shops/shops.service';
import { CountersService } from '@app/database-scrooge/counters/counters.service';
import { TiktokOrderService } from '@app/database-orderhub/tiktok_order/tiktok_order.service';
import { SalesInvoiceService } from '@app/database-orderhub/sales_invoice/sales_invoice.service';
@Controller('tiktok')
export class TiktokController {
    constructor(
        private readonly tiktokService: TiktokService,
        private readonly shopsService: ShopsService,
        private readonly countersService: CountersService,
        private readonly tiktokOrderService: TiktokOrderService,
        private readonly salesInvoiceService: SalesInvoiceService,
        private readonly deduplicationService: SimpleDeduplicationService,
        @Inject('TIKTOK_TRANSFORMER_SERVICE')
        private readonly tiktokTransformerClient: ClientProxy
    ) {}

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.GET_ORDER_SEARCH)
    async getOrderSearch(params: { shop_id: string }) {
        const shop = await this.shopsService.findByTiktokShopCode(params.shop_id);
        if (!shop) {
            throw new BadRequestException('Shop do not exists');
        }

        const { access_token, tiktok_shop_cipher } = shop;

        const getOrderSearchParams = {
            shopCipher: tiktok_shop_cipher,
            accessToken: access_token,
            pageSize: 50,
            sortOrder: 'DESC',
        };
        return await this.tiktokService.getOrderSearch(getOrderSearchParams);
    }

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.GET_ORDER_DETAILS)
    async getOrderDetails(params: { shop_id: string; order_id: string, name?: string, full_address?: string, tin?: string }) {
        const shop = await this.shopsService.findByTiktokShopCode(params.shop_id);

        if (!shop) {
            throw new RpcException(new NotFoundException(`Shop not found for shop_id: ${params.shop_id}`));
        }

        const { access_token, tiktok_shop_cipher, tiktok_shop_code } = shop;

        const getOrderDetailsParams = {
            ids: [params.order_id],
            accessToken: access_token,
            shopCipher: tiktok_shop_cipher,
            tiktokShopCode: tiktok_shop_code,
        };

        const apiResult = await this.tiktokService.getOrderDetails(getOrderDetailsParams);

        // Validate API result structure
        if (!apiResult || !apiResult.data) {
            throw new RpcException(new NotFoundException(`Invalid API response for shop_id: ${params.shop_id}, order_id: ${params.order_id}`));
        }

        if (!apiResult.data.orders || apiResult.data.orders.length === 0) {
            throw new RpcException(new NotFoundException(`Order not found in tiktok for shop_id: ${params.shop_id}, order_id: ${params.order_id}`));
        }
        console.log(`🔥 EMITTING tiktok.raw_order_details for fresh data: ${params.shop_id}_${params.order_id}`);
        this.tiktokTransformerClient.emit('tiktok.raw_order_details', {
            orders: apiResult.data.orders,
            shop: shop,
            customer_info: {
                name: params.name,
                full_address: params.full_address,
                tin: params.tin
            }
        });
    
        return apiResult;
    }

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.GET_SUPPORT_ORDER_DETAILS)
    async getSupportOrderDetails(params: { shop_id: string; order_id: string }) {
        try {
            // Validate required parameters
            if (!params.shop_id || !params.order_id) {
                throw new RpcException(new BadRequestException('Both shop_id and order_id are required'));
            }
            
            // Fetch order details from database-orderhub instead of TikTok API
            const order = await this.tiktokOrderService.findOrderWithItems({
                shopId: params.shop_id,
                orderId: params.order_id
            });

            if (!order) {
                throw new RpcException(new NotFoundException(`Order not found in database for shop_id: ${params.shop_id}, order_id: ${params.order_id}`));
            }
            
            // Return formatted result with database order information
            return {
                order
            };
        } catch (error) {
            // Re-throw RpcExceptions as-is
            if (error instanceof RpcException) {
                throw error;
            }
            
            // Wrap other errors
            throw new RpcException(new InternalServerErrorException('Database error occurred while fetching order details'));
        }
    }

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.GET_SALES_INVOICES)
    async getSalesInvoices(params: { shop_id: string; order_id: string }) {
        try {
            // Validate required parameters
            if (!params.shop_id || !params.order_id) {
                throw new RpcException(new BadRequestException('Both shop_id and order_id are required'));
            }
      
            // Fetch sales invoices for the order
            const salesInvoices = await this.salesInvoiceService.findByOrder(params.order_id, params.shop_id);
            
            return {
                success: true,
                data: salesInvoices,
                count: salesInvoices.length,
            };
        } catch (error) {
            // Re-throw RpcExceptions as-is
            if (error instanceof RpcException) {
                throw error;
            }
            
            // Wrap other errors
            throw new RpcException(new InternalServerErrorException('Database error occurred while fetching sales invoices'));
        }
    }

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.GET_SHOPS)
    async getShops() {
        try {
            const shops = await this.shopsService.findAll();
            return shops.map(shop => ({
                id: shop.id,
                name: shop.name,
                tiktok_shop_id: shop.tiktok_shop_id,
                tiktok_shop_code: shop.tiktok_shop_code
            }));
        } catch (error) {
            throw new BadRequestException('Failed to fetch shops');
        }
    }

    @MessagePattern('tiktok.get_deduplication_metrics')
    async getDeduplicationMetrics() {
        try {
            const metrics = this.deduplicationService.getMetrics();
            return metrics;
        } catch (error) {
            throw new BadRequestException('Failed to fetch deduplication metrics');
        }
    }

    @MessagePattern('tiktok.reset_deduplication_metrics')
    async resetDeduplicationMetrics() {
        try {
            this.deduplicationService.resetMetrics();
            return { message: 'Deduplication metrics reset successfully' };
        } catch (error) {
            throw new BadRequestException('Failed to reset deduplication metrics');
        }
    }

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.UPDATE_UNMASKED_DETAILS)
    async updateUnmaskedDetails(params: {
        shop_id: string;
        order_id: string;
        name_unmasked?: string;
        address_detail_unmasked?: string;
        tin?: string;
    }) {
        try {
            // Update the order in the database with unmasked details
            const updatedOrder = await this.tiktokOrderService.updateUnmaskedDetails({
                shopId: params.shop_id,
                orderId: params.order_id,
                nameUnmasked: params.name_unmasked,
                addressDetailUnmasked: params.address_detail_unmasked,
                tin: params.tin
            });

            return {
                success: true,
                shop_id: params.shop_id,
                order_id: params.order_id,
                name_unmasked: params.name_unmasked,
                address_detail_unmasked: params.address_detail_unmasked,
                tin: params.tin,
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error updating unmasked details:', error);
            throw new RpcException(new InternalServerErrorException('Failed to update unmasked details'));
        }
    }

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.GET_UNMASKED_DETAILS)
    async getUnmaskedDetails(params: { shop_id: string; order_id: string }) {
        try {
            // Fetch order with unmasked details from database
            const order = await this.tiktokOrderService.findOrderWithUnmaskedDetails({
                shopId: params.shop_id,
                orderId: params.order_id
            });

            if (!order) {
                throw new RpcException(new NotFoundException(`Order not found for shop_id: ${params.shop_id}, order_id: ${params.order_id}`));
            }

            return {
                shop_id: params.shop_id,
                order_id: params.order_id,
                name_unmasked: order.name_unmasked,
                address_detail_unmasked: order.addressDetailUnmasked,
                tin: order.tin,
                updated_at: order.updatedAt
            };
        } catch (error) {
            if (error instanceof RpcException) {
                throw error;
            }
            console.error('Error getting unmasked details:', error);
            throw new RpcException(new InternalServerErrorException('Failed to retrieve unmasked details'));
        }
    }
}
