import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { RawOrderDetailsDto } from '@app/contracts/tiktok-fetcher/dto/';
import { OrderDetailsService } from './order-details.service';
import { TransformedOrderDetailsDto } from '@app/contracts/tiktok-transformer/dto/order-details.dto';

@Controller()
export class OrderDetailsController {
    private readonly logger = new Logger(OrderDetailsController.name);
    constructor(
        private readonly orderDetailsService: OrderDetailsService,
        @Inject('TIKTOK_LOADER_SERVICE')
        private readonly tiktokLoaderClient: ClientProxy
    ) {}

    @MessagePattern('tiktok.raw_order_details')
    transformRawOrderDetails(
        @Payload() payload: RawOrderDetailsDto
    ): TransformedOrderDetailsDto {
        this.logger.log(
            '[OrderDetailsController] Received tiktok.raw_order_details:',
            payload.orders?.length.toString() + ' orders'
        );
        const transformedOrderDetails =
            this.orderDetailsService.transformRawOrderDetails(payload);

        if (transformedOrderDetails.orders.length > 0) {
            this.logger.log(
                '[OrderDetailsController] Emitting transformed order details to tiktok-loader'
            );
            this.tiktokLoaderClient.emit(
                'tiktok.transformed_order_details',
                transformedOrderDetails
            );
        }
        return transformedOrderDetails;
    }
}
