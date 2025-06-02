import { BadRequestException, Controller, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { MessagePattern, ClientProxy, RpcException } from '@nestjs/microservices';
import { TiktokService } from './tiktok.service';
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
            throw new BadRequestException('Shop do not exists');
        }

        const { access_token, tiktok_shop_cipher, tiktok_shop_code } = shop;

        const getOrderDetailsParams = {
            ids: [params.order_id],
            accessToken: access_token,
            shopCipher: tiktok_shop_cipher,
            tiktokShopCode: tiktok_shop_code,
        };

        const result = await this.tiktokService.getOrderDetails(
            getOrderDetailsParams
        );

        if (result.data.orders && result.data.orders.length > 0) {
            this.tiktokTransformerClient.emit('tiktok.raw_order_details', {
                orders: result.data.orders,
                shop: shop,
                customer_info: {
                    name: params.name,
                    full_address: params.full_address,
                    tin: params.tin
                }
            });
        }else {
            console.error(`Order not found for shop_id: ${params.shop_id}, order_id: ${params.order_id}`);
            throw new RpcException(new NotFoundException(`Order not found in tiktok for shop_id: ${params.shop_id}, order_id: ${params.order_id}`));
        }
        return result;
    }

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.GET_SUPPORT_ORDER_DETAILS)
    async getSupportOrderDetails(params: { shop_id: string; order_id: string }) {
        try {
            console.log('TikTok Fetcher - getSupportOrderDetails called with:', params);
            
            // Validate required parameters
            if (!params.shop_id || !params.order_id) {
                console.error('Missing required parameters:', params);
                throw new RpcException(new BadRequestException('Both shop_id and order_id are required'));
            }
            
            // Fetch order details from database-orderhub instead of TikTok API
            const order = await this.tiktokOrderService.findOrderWithItems({
                shopId: params.shop_id,
                orderId: params.order_id
            });

            if (!order) {
                console.error(`Order not found for shop_id: ${params.shop_id}, order_id: ${params.order_id}`);
                throw new RpcException(new NotFoundException(`Order not found in database for shop_id: ${params.shop_id}, order_id: ${params.order_id}`));
            }
            
            console.log('Order found successfully:', order.id);
            
            // Return formatted result with database order information
            return {
                order
            };
        } catch (error) {
            console.error('Error in TikTok Fetcher getSupportOrderDetails:', error);
            
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
            console.log('TikTok Fetcher - getSalesInvoices called with:', params);
            
            // Validate required parameters
            if (!params.shop_id || !params.order_id) {
                console.error('Missing required parameters:', params);
                throw new RpcException(new BadRequestException('Both shop_id and order_id are required'));
            }
      
            // Fetch sales invoices for the order
            const salesInvoices = await this.salesInvoiceService.findByOrder(params.order_id, params.shop_id);
            
            console.log(`Found ${salesInvoices.length} sales invoices for order ${params.order_id}`);
            
            return {
                success: true,
                data: salesInvoices,
                count: salesInvoices.length,
            };
        } catch (error) {
            console.error('Error in TikTok Fetcher getSalesInvoices:', error);
            
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
            console.error('Error fetching shops:', error);
            throw new BadRequestException('Failed to fetch shops');
        }
    }
}
