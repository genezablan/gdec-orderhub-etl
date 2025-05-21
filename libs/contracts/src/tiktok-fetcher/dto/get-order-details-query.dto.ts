import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetOrderDetailsQueryDto {
    @ApiProperty({ description: 'Shop ID' })
    @IsString()
    shop_id: string;

    @ApiProperty({ description: 'Order ID' })
    @IsString()
    order_id: string;
}
