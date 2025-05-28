import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetOrdersQueryDto {
    @ApiProperty({ description: 'Shop ID' })
    @IsString()
    shop_id: string;
}
