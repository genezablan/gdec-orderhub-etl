import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TestService {
  constructor(
    @Inject('TIKTOK_FETCHER_SERVICE')
    private tiktokFetchServiceClient: ClientProxy,
  ) {}
  getHello() {
    return this.tiktokFetchServiceClient.send('tiktok.fetchOrderDetails', {});
  }
}
