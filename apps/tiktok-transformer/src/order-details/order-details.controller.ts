import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { RawOrderDetailsDto } from '@app/contracts/tiktok-fetcher/dto/';
import { OrderDetailsService } from './order-details.service';
import { TransformedOrderDetailsDto } from '@app/contracts/tiktok-transformer/dto/order-details.dto';

@Controller()
export class OrderDetailsController {
    constructor(
        private readonly orderDetailsService: OrderDetailsService,
        @Inject('TIKTOK_LOADER_SERVICE')
        private readonly tiktokLoaderClient: ClientProxy
    ) {}

    @MessagePattern('tiktok.raw_order_details')
    transformRawOrderDetails(
        @Payload() payload: RawOrderDetailsDto
    ): TransformedOrderDetailsDto {
        console.log(
            '[OrderDetailsController] Received tiktok.raw_order_details:',
            payload
        );
        const transformedOrderDetails =
            this.orderDetailsService.transformRawOrderDetails(payload);

        if (transformedOrderDetails.orders.length > 0) {
            console.log(
                '[OrderDetailsController] Emitting transformed order details to tiktok-loader'
            );
            this.tiktokLoaderClient.emit(
                'tiktok.transformed_order_details',
                transformedOrderDetails
            );
        }

        console.log(transformedOrderDetails);
        return transformedOrderDetails;
    }
}
