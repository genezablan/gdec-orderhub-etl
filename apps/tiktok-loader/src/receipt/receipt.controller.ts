import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReceiptService } from './receipt.service';
import { ReceiptDto } from '@app/contracts/tiktok-transformer/dto/receipt.dto';
import * as path from 'path';

@Controller()
export class ReceiptController {
    constructor(private readonly receiptService: ReceiptService) {}

    @MessagePattern('tiktok.transformed_receipt')
    async generateReceipt(@Payload() payload: ReceiptDto[]) {
        console.log('Payload received in ReceiptController:', payload);
        for (const [i, receipt] of payload.entries()) {
            const outputPath = path.join(
                __dirname,
                'output',
                `receipt_${i + 1}.pdf`
            );

            console.log('Receipt data:', JSON.stringify(receipt));
            await this.receiptService.generatePdf(receipt, outputPath);
        }
    }
}
