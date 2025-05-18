import { Controller } from '@nestjs/common';
import { TransformerService } from './transformer.service';
import {
    IOrderDetailsRaw,
    ITransformedOrderDetails,
} from './transformer.interface';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class TransformerController {
    constructor(private readonly transformerService: TransformerService) {}

    @MessagePattern('tiktok.raw_order_details')
    transformRawOrderDetails(
        @Payload() raw: IOrderDetailsRaw[]
    ): ITransformedOrderDetails[] {
        const transformedOrderDetails =
            this.transformerService.transformRawOrderDetails(raw);

        console.log(transformedOrderDetails);

        return transformedOrderDetails;
    }
}
