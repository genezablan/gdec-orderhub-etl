import { Controller, Get } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { HealthService } from '@app/health';
import { Public } from '@app/auth';

@Controller()
export class ApiGatewayController {
    constructor(
        private readonly apiGatewayService: ApiGatewayService,
        private readonly healthService: HealthService
    ) {}

    @Public()
    @Get()
    getHello() {
        return this.apiGatewayService.getHello();
    }

    @Public()
    @Get('health')
    getHealth() {
        return this.healthService.getHealthStatus('api-gateway');
    }
}
