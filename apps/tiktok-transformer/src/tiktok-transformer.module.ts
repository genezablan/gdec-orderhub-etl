import { Module } from '@nestjs/common';
import { TiktokTransformerController } from './tiktok-transformer.controller';
import { TiktokTransformerService } from './tiktok-transformer.service';
import { ReceiptModule } from './receipt/receipt.module';

@Module({
    imports: [ReceiptModule],
    controllers: [TiktokTransformerController],
    providers: [TiktokTransformerService],
})
export class TiktokTransformerModule {}
