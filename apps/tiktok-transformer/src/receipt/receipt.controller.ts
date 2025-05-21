import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RawOrderDetailsDto } from '@app/contracts/tiktok-fetcher/dto/';
import { ReceiptDto } from '@app/contracts/tiktok-transformer/dto/';
import { ReceiptService } from './receipt.service';

@Controller()
export class ReceiptController {
    constructor(private readonly receiptService: ReceiptService) {}

    @MessagePattern('tiktok.raw_order_details')
    transformRawOrderDetails(
        @Payload() payload: RawOrderDetailsDto
    ): ReceiptDto[] {
        const transformedOrderDetails =
            this.receiptService.transformRawOrderDetails(payload);

        console.log('transformedOrderDetails:', transformedOrderDetails);
        return transformedOrderDetails;
    }
}
