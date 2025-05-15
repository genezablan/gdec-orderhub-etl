import { Controller, Get } from '@nestjs/common';
import { TiktokFetcherService } from './tiktok-fetcher.service';
@Controller()
export class TiktokFetcherController {
    constructor(private readonly tiktokFetcherService: TiktokFetcherService) {}

    fetchOrderDetails(): string {
        return this.tiktokFetcherService.getHello();
    }
}
