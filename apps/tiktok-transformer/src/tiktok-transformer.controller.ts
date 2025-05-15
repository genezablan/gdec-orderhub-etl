import { Controller, Get } from '@nestjs/common';
import { TiktokTransformerService } from './tiktok-transformer.service';

@Controller()
export class TiktokTransformerController {
    constructor(
        private readonly tiktokTransformerService: TiktokTransformerService
    ) {}

    @Get()
    getHello(): string {
        return this.tiktokTransformerService.getHello();
    }
}
