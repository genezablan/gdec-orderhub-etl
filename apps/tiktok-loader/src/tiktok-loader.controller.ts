import { Controller, Get } from '@nestjs/common';
import { TiktokLoaderService } from './tiktok-loader.service';
import { HealthService } from '@app/health';

@Controller()
export class TiktokLoaderController {
    constructor(
        private readonly tiktokLoaderService: TiktokLoaderService,
        private readonly healthService: HealthService
    ) {}

    @Get()
    getHello(): string {
        return this.tiktokLoaderService.getHello();
    }

    @Get('health')
    getHealth() {
        return this.healthService.getHealthStatus('tiktok-loader');
    }
}
