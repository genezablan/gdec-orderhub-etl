import { Controller } from '@nestjs/common';
import { TransformerService } from './transformer.service';
import { IOrderDetailsRaw } from './transformer.interface';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class TransformerController {
    constructor(private readonly transformerService: TransformerService) {}

    @MessagePattern('tiktok.raw_order_details')
    transformRawOrderDetails(@Payload() raw: IOrderDetailsRaw) {
        console.log('transformRawOrderDetails', raw);
        return {
            test: 1,
        };
    }
}
