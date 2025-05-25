import { IsString, IsOptional, IsNumber, IsDate } from 'class-validator';

export class TiktokOrderItemDto {
    @IsString()
    id: string;

    @IsString()
    orderId: string;

    @IsString()
    shopId: string;

    @IsOptional()
    @IsString()
    itemId?: string;

    @IsOptional()
    @IsString()
    productId?: string;

    @IsOptional()
    @IsString()
    productName?: string;

    @IsOptional()
    @IsString()
    skuId?: string;

    @IsOptional()
    @IsString()
    skuName?: string;

    @IsOptional()
    @IsString()
    skuImage?: string;

    @IsOptional()
    @IsNumber()
    quantity?: number;

    @IsOptional()
    @IsString()
    price?: string;

    @IsOptional()
    @IsString()
    originalPrice?: string;

    @IsOptional()
    @IsString()
    salePrice?: string;

    @IsOptional()
    @IsString()
    platformDiscount?: string;

    @IsOptional()
    @IsString()
    sellerDiscount?: string;

    @IsOptional()
    @IsString()
    totalActualPrice?: string;

    @IsOptional()
    @IsString()
    shippingProviderId?: string;

    @IsOptional()
    @IsString()
    shippingProviderName?: string;

    @IsOptional()
    @IsString()
    trackingNumber?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsDate()
    createdAt?: Date;

    @IsOptional()
    @IsDate()
    updatedAt?: Date;
}
