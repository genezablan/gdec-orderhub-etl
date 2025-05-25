import { BadRequestException, Controller, Inject } from '@nestjs/common';
import { MessagePattern, ClientProxy } from '@nestjs/microservices';
import { TiktokService } from './tiktok.service';
import { TIKTOK_FETCHER_PATTERNS } from '@app/contracts/tiktok-fetcher/tiktok-fetcher.patterns';
import { ShopsService } from '@app/database-tiktok/shops/shops.service';
import { CountersService } from '@app/database-scrooge/counters/counters.service';
@Controller('tiktok')
export class TiktokController {
    constructor(
        private readonly tiktokService: TiktokService,
        private readonly shopsService: ShopsService,
        private readonly countersService: CountersService,
        @Inject('TIKTOK_TRANSFORMER_SERVICE')
        private readonly tiktokTransformerClient: ClientProxy
    ) {}

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.GET_ORDER_SEARCH)
    async getOrderSearch(params: { shop_id: string }) {
        const shop = await this.shopsService.findByTiktokShopId(params.shop_id);
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
    async getOrderDetails(params: { shop_id: string; order_id: string }) {
        const shop = await this.shopsService.findByTiktokShopId(params.shop_id);

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
            });
        }
        return result;
    }
}
