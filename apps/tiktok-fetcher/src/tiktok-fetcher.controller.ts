import { Controller, Get } from '@nestjs/common';
import { TiktokFetcherService } from './tiktok-fetcher.service';
import { HealthService } from '@app/health';

@Controller()
export class TiktokFetcherController {
    constructor(
        private readonly tiktokFetcherService: TiktokFetcherService,
        private readonly healthService: HealthService
    ) {}

    fetchOrderDetails(): string {
        return this.tiktokFetcherService.getHello();
    }

    @Get('health')
    getHealth() {
        return this.healthService.getHealthStatus('tiktok-fetcher');
    }
}
