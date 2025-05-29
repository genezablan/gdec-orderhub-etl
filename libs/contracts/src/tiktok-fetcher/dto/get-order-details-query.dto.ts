import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetOrderDetailsQueryDto {
    @ApiProperty({ description: 'Shop ID' })
    @IsString()
    shop_id: string;

    @ApiProperty({ description: 'Order ID' })
    @IsString()
    order_id: string;

    @ApiProperty({ description: 'Name' })
    @IsString()
    @IsOptional()
    name: string

    
    @ApiProperty({ description: 'Full Address' })
    @IsString()
    @IsOptional()
    full_address: string

    @ApiProperty({ description: 'tin' })
    @IsString()
    @IsOptional()
    tin: string
           
}
