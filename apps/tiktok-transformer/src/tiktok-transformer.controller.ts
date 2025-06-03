import { Controller, Get } from '@nestjs/common';
import { TiktokTransformerService } from './tiktok-transformer.service';
import { HealthService } from '@app/health';

@Controller()
export class TiktokTransformerController {
    constructor(
        private readonly tiktokTransformerService: TiktokTransformerService,
        private readonly healthService: HealthService
    ) {}

    @Get()
    getHello(): string {
        return this.tiktokTransformerService.getHello();
    }

    @Get('health')
    getHealth() {
        return this.healthService.getHealthStatus('tiktok-transformer');
    }
}
