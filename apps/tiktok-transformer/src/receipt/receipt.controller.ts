import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { RawOrderDetailsDto } from '@app/contracts/tiktok-fetcher/dto/';
import { ReceiptDto } from '@app/contracts/tiktok-transformer/dto/';
import { ReceiptService } from './receipt.service';

@Controller()
export class ReceiptController {
    constructor(
        private readonly receiptService: ReceiptService,
        @Inject('TIKTOK_LOADER_SERVICE')
        private readonly tiktokLoaderClient: ClientProxy // Assuming you have a ClientProxy instance for tiktok-loader
    ) {}

    @MessagePattern('tiktok.raw_order_detailsss')
    transformRawOrderDetails(
        @Payload() payload: RawOrderDetailsDto
    ): ReceiptDto[] {
        const transformedOrderDetails =
            this.receiptService.transformRawOrderDetails(payload);
        if (transformedOrderDetails.length > 0) {
            console.log('Emitting transformed receipt to tiktok-loader');
            this.tiktokLoaderClient.emit(
                'tiktok.transformed_receipt',
                transformedOrderDetails
            );
            console.log('Emitted transformed receipt to tiktok-loader');
        }
        return transformedOrderDetails;
    }
}
