import { Controller, Get } from '@nestjs/common';
import { TiktokLoaderService } from './tiktok-loader.service';

@Controller()
export class TiktokLoaderController {
    constructor(private readonly tiktokLoaderService: TiktokLoaderService) {}

    @Get()
    getHello(): string {
        return this.tiktokLoaderService.getHello();
    }
}
