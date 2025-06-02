import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetSalesInvoicesQueryDto {
    @ApiProperty({ 
        description: 'Shop ID',
        example: 'shop123',
        required: true
    })
    @IsNotEmpty({ message: 'shop_id is required' })
    @IsString({ message: 'shop_id must be a string' })
    shop_id: string;

    @ApiProperty({ 
        description: 'Order ID',
        example: 'order456',
        required: true
    })
    @IsNotEmpty({ message: 'order_id is required' })
    @IsString({ message: 'order_id must be a string' })
    order_id: string;
}
