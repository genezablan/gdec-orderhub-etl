import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Injectable()
export class ApiGatewayService {
    constructor(
        @Inject('TIKTOK_FETCHER_SERVICE')
        private readonly tiktokFetcherClient: ClientProxy
    ) {}
    getHello(): Observable<any> {
        return this.tiktokFetcherClient.send('tiktok.fetchOrderDetails', {});
    }
}
