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
        const now = new Date();
        // Convert to UTC+8
        const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const formattedDate = utc8.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
        });
        for (const [i, receipt] of payload.entries()) {
            // Set invoice_printed_date for each package
            if (receipt.packages && Array.isArray(receipt.packages)) {
                for (const pkg of receipt.packages) {
                    pkg.invoice_printed_date = formattedDate;
                }
            }
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
