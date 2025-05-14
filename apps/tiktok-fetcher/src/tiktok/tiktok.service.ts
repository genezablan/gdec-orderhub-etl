import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import {
    IGenerateSignatureParams,
    IGetOrderDetailsParams,
    IGetOrderDetailsResponse,
    IGetOrderSearchParams,
    IGetOrderSearchResponse,
} from './tiktok.interface';

@Injectable()
export class TiktokService {
    constructor(private configService: ConfigService) {
        this.appKey = this.configService.get<string>('TIKTOK_APP_KEY', '');
        this.appSecret = this.configService.get<string>(
            'TIKTOK_APP_SECRET',
            ''
        );
        this.endpoint = this.configService.get<string>('TIKTOK_ENDPOINT', '');
        this.orderSearchApi = this.configService.get<string>(
            'TIKTOK_ORDER_SEARCH_API',
            ''
        );

        this.getOrderDetailsApi = this.configService.get<string>(
            'TIKTOK_ORDER_DETAILS_API',
            ''
        );
    }

    private readonly appKey: string;
    private readonly appSecret: string;
    private readonly endpoint: string;
    private readonly orderSearchApi: string;
    private readonly getOrderDetailsApi: string;

    public generateSignature(requestOption: IGenerateSignatureParams): string {
        const excludeKeys: string[] = ['access_token', 'sign'];
        let signString = '';

        // Step 1: Extract and sort query parameters
        const params = requestOption.qs || {};
        const sortedParams = Object.keys(params)
            .filter(key => !excludeKeys.includes(key))
            .sort()
            .map(key => ({ key, value: params[key] as string }));
        // Step 2: Concatenate parameters
        const paramString = sortedParams
            .map(({ key, value }) => `${key}${value}`)
            .join('');

        console.log('Sorted Parameters:', paramString);
        signString += paramString;

        // Step 3: Append API request path
        const pathname = new URL(requestOption.uri).pathname;
        signString = `${pathname}${paramString}`;
        // Step 4: Append request body if content-type is not multipart/form-data
        if (
            requestOption.headers?.['content-type'] !== 'multipart/form-data' &&
            requestOption.body &&
            Object.keys(requestOption.body).length
        ) {
            const body = JSON.stringify(requestOption.body);
            signString += body;
        }

        // Step 5: Wrap with appSecret
        signString = `${this.appSecret}${signString}${this.appSecret}`;

        // Step 6: Encode using HMAC-SHA256
        const hmac = createHmac('sha256', this.appSecret);
        hmac.update(signString);
        return hmac.digest('hex');
    }

    async getOrderSearch(
        params: IGetOrderSearchParams
    ): Promise<IGetOrderSearchResponse> {
        const timestamp = Math.floor(Date.now() / 1000);

        const url = `${this.endpoint}${this.orderSearchApi}`;
        const sign = this.generateSignature({
            uri: url,
            qs: {
                timestamp,
                shop_cipher: params.shopCipher,
                page_size: params.pageSize,
                sort_order: params.sortOrder,
                app_key: this.appKey,
            },
            headers: { 'content-type': 'application/json' },
            body: params.body,
        });

        const queryParams = {
            timestamp,
            shop_cipher: params.shopCipher,
            page_size: params.pageSize,
            sort_order: params.sortOrder ?? 'DESC',
            app_key: this.appKey,
            sign: sign,
        };

        try {
            const response = await axios.post(url, params.body, {
                params: queryParams,
                headers: {
                    'x-tts-access-token': params.accessToken,
                    'content-type': 'application/json',
                },
            });
            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error(
                    'Error fetching order search:',
                    error.response?.data
                );
                throw new Error(
                    `Failed to fetch order search: ${
                        error.message || 'Unknown error occurred'
                    }`
                );
            }
            throw new Error('An unexpected error occurred');
        }
    }

    async getOrderDetails(
        params: IGetOrderDetailsParams
    ): Promise<IGetOrderDetailsResponse> {
        const timestamp = Math.floor(Date.now() / 1000);

        const url = `${this.endpoint}${this.getOrderDetailsApi}`;
        const sign = this.generateSignature({
            uri: url,
            qs: {
                app_key: this.appKey,
                timestamp,
                shop_cipher: params.shopCipher,
                ids: params.ids.join(','),
            },
            headers: { 'content-type': 'application/json' },
        });

        const queryParams = {
            app_key: this.appKey,
            timestamp,
            shop_cipher: params.shopCipher,
            ids: params.ids.join(','),
            sign,
        };

        try {
            const response = await axios.get<IGetOrderDetailsResponse>(url, {
                params: queryParams,
                headers: {
                    'x-tts-access-token': params.accessToken,
                    'content-type': 'application/json',
                },
            });

            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error(
                    'Error fetching order details:',
                    error.response?.data
                );
                throw new Error(
                    `Failed to fetch order details: ${
                        error.message || 'Unknown error occurred'
                    }`
                );
            }
            throw new Error('An unexpected error occurred');
        }
    }
}
