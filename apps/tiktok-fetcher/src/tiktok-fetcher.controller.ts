import { Controller, Get } from '@nestjs/common';
import { TiktokFetcherService } from './tiktok-fetcher.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class TiktokFetcherController {
  constructor(private readonly tiktokFetcherService: TiktokFetcherService) {}

  @MessagePattern('tiktok.fetchOrderDetails')
  fetchOrderDetails(): string {
    return this.tiktokFetcherService.getHello();
  }
}
