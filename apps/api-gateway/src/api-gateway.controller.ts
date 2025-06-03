import { Controller, Get } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { HealthService } from '@app/health';

@Controller()
export class ApiGatewayController {
    constructor(
        private readonly apiGatewayService: ApiGatewayService,
        private readonly healthService: HealthService
    ) {}

    @Get()
    getHello() {
        return this.apiGatewayService.getHello();
    }

    @Get('health')
    getHealth() {
        return this.healthService.getHealthStatus('api-gateway');
    }
}
