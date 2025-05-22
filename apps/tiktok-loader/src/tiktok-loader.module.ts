import { Module } from '@nestjs/common';
import { TiktokLoaderController } from './tiktok-loader.controller';
import { TiktokLoaderService } from './tiktok-loader.service';
import { ReceiptModule } from './receipt/receipt.module';

@Module({
    imports: [ReceiptModule],
    controllers: [TiktokLoaderController],
    providers: [TiktokLoaderService],
})
export class TiktokLoaderModule {}
