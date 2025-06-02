import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TIKTOK_FETCHER_PATTERNS } from '@app/contracts/tiktok-fetcher/tiktok-fetcher.patterns';
import { GetOrdersQueryDto } from '@app/contracts/tiktok-fetcher/dto/get-orders-query.dto';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';

@Injectable()
export class TiktokService {
    constructor(
        @Inject('TIKTOK_FETCHER_SERVICE')
        private tiktokFetchServiceClient: ClientProxy
    ) {}

    getOrders(params: GetOrdersQueryDto) {
        return this.tiktokFetchServiceClient.send(
            TIKTOK_FETCHER_PATTERNS.GET_ORDER_SEARCH,
            {
                shop_id: params.shop_id,
            }
        );
    }

    getOrderDetails(params: { shop_id: string; order_id: string , name?:string, full_address?:string, tin?: string}) {
        return this.tiktokFetchServiceClient.send(
            TIKTOK_FETCHER_PATTERNS.GET_ORDER_DETAILS,
            {
                shop_id: params.shop_id,
                order_id: params.order_id,
                name: params.name,
                full_address: params.full_address,
                tin: params.tin
            }
        );
    }

    async getSupportOrderDetails(params: { shop_id: string; order_id: string }) {
        return await firstValueFrom(
            this.tiktokFetchServiceClient.send(
                TIKTOK_FETCHER_PATTERNS.GET_SUPPORT_ORDER_DETAILS,
                {
                    shop_id: params.shop_id,
                    order_id: params.order_id
                }
            ).pipe(
                timeout(10000) // 10 second timeout
            )
        );
    }

    async getSalesInvoices(params: { shop_id: string; order_id: string }) {
        return await firstValueFrom(
            this.tiktokFetchServiceClient.send(
                TIKTOK_FETCHER_PATTERNS.GET_SALES_INVOICES,
                {
                    shop_id: params.shop_id,
                    order_id: params.order_id
                }
            ).pipe(
                timeout(10000) // 10 second timeout
            )
        );
    }

    getShops() {
        return this.tiktokFetchServiceClient.send(
            TIKTOK_FETCHER_PATTERNS.GET_SHOPS,
            {}
        );
    }
}
