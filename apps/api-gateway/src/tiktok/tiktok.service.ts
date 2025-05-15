import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
@Injectable()
export class TiktokService {
    constructor(
        @Inject('TIKTOK_FETCHER_SERVICE')
        private tiktokFetchServiceClient: ClientProxy
    ) {}

    getOrders(params: { shop_id: string }) {
        return this.tiktokFetchServiceClient.send('tiktok.fetchOrders', {
            shop_id: params.shop_id,
        });
    }

    getOrderDetails(params: { shop_id: string; order_id: string }) {
        return this.tiktokFetchServiceClient.send('tiktok.fetchOrderDetails', {
            shop_id: params.shop_id,
            order_id: params.order_id,
        });
    }
}
