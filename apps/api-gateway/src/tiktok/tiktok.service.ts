import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TIKTOK_FETCHER_PATTERNS } from '@app/contracts/tiktok-fetcher/tiktok-fetcher.patterns';
import { GetOrdersQueryDto } from '@app/contracts/tiktok-fetcher/dto/get-orders-query.dto';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';

@Injectable()
export class TiktokService {
    constructor(
        @Inject('TIKTOK_FETCHER_SERVICE')
        private tiktokFetchServiceClient: ClientProxy,
        @Inject('TIKTOK_RECEIPT_SERVICE')
        private tiktokReceiptServiceClient: ClientProxy
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

    async updateUnmaskedDetails(params: {
        shop_id: string;
        order_id: string;
        name_unmasked?: string;
        address_detail_unmasked?: string;
        tin?: string;
    }) {
        return await firstValueFrom(
            this.tiktokFetchServiceClient.send(
                TIKTOK_FETCHER_PATTERNS.UPDATE_UNMASKED_DETAILS,
                params
            ).pipe(
                timeout(10000) // 10 second timeout
            )
        );
    }

    async getUnmaskedDetails(params: { shop_id: string; order_id: string }) {
        return await firstValueFrom(
            this.tiktokFetchServiceClient.send(
                TIKTOK_FETCHER_PATTERNS.GET_UNMASKED_DETAILS,
                params
            ).pipe(
                timeout(10000) // 10 second timeout
            )
        );
    }

    async updateSalesInvoice(id: string, updateData: any) {
        return await firstValueFrom(
            this.tiktokReceiptServiceClient.send(
                TIKTOK_FETCHER_PATTERNS.UPDATE_SALES_INVOICE,
                {
                    id,
                    updateData
                }
            ).pipe(
                timeout(10000) // 10 second timeout
            )
        );
    }

    async reprintInvoice(salesInvoiceId: string) {
        return await firstValueFrom(
            this.tiktokReceiptServiceClient.send(
                'tiktok.reprint_invoice',
                { salesInvoiceId }
            ).pipe(
                timeout(30000) // 30 second timeout for PDF generation
            )
        );
    }
}
