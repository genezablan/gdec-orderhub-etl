import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { ReceiptController } from './receipt.controller';

@Module({
    imports: [],
    controllers: [ReceiptController],
    providers: [ReceiptService],
})
export class ReceiptModule {}
