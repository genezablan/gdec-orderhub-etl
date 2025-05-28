import {
    IsString,
    IsOptional,
    IsNumber,
    IsBoolean,
    IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

import { TiktokOrderItemDto } from './tiktok_order_item.dto';

export class TiktokOrderDto {
    @IsString()
    id: string;

    @IsString()
    orderId: string;

    @IsString()
    shopId: string;

    @IsOptional()
    @IsString()
    buyerEmail?: string;

    @IsOptional()
    @IsString()
    buyerMessage?: string;

    @IsOptional()
    @Type(() => Date)
    cancelOrderSlaTime?: Date;

    @IsOptional()
    @Type(() => Date)
    collectionDueTime?: Date;

    @IsOptional()
    @Type(() => Date)
    collectionTime?: Date;

    @IsOptional()
    @IsString()
    commercePlatform?: string;

    @IsOptional()
    @Type(() => Date)
    createTime?: Date;

    @IsOptional()
    @IsString()
    deliveryOptionId?: string;

    @IsOptional()
    @IsString()
    deliveryOptionName?: string;

    @IsOptional()
    @Type(() => Date)
    deliveryTime?: Date;

    @IsOptional()
    @IsString()
    deliveryType?: string;

    @IsOptional()
    @IsString()
    fulfillmentType?: string;

    @IsOptional()
    @IsBoolean()
    hasUpdatedRecipientAddress?: boolean;

    @IsOptional()
    @IsString()
    tiktokId?: string;

    @IsOptional()
    @IsBoolean()
    isCod?: boolean;

    @IsOptional()
    @IsBoolean()
    isOnHoldOrder?: boolean;

    @IsOptional()
    @IsBoolean()
    isReplacementOrder?: boolean;

    @IsOptional()
    @IsBoolean()
    isSampleOrder?: boolean;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    originalShippingFee?: string;

    @IsOptional()
    @IsString()
    originalTotalProductPrice?: string;

    @IsOptional()
    @IsString()
    platformDiscount?: string;

    @IsOptional()
    @IsString()
    sellerDiscount?: string;

    @IsOptional()
    @IsString()
    shippingFee?: string;

    @IsOptional()
    @IsString()
    shippingFeeCofundedDiscount?: string;

    @IsOptional()
    @IsString()
    shippingFeePlatformDiscount?: string;

    @IsOptional()
    @IsString()
    shippingFeeSellerDiscount?: string;

    @IsOptional()
    @IsString()
    subTotal?: string;

    @IsOptional()
    @IsString()
    tax?: string;

    @IsOptional()
    @IsString()
    totalAmount?: string;

    @IsOptional()
    @IsString()
    paymentMethodName?: string;

    @IsOptional()
    @IsString()
    addressDetail?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    region?: string;

    @IsOptional()
    @IsString()
    province?: string;

    @IsOptional()
    @IsString()
    municipality?: string;

    @IsOptional()
    @IsString()
    barangay?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    firstNameLocalScript?: string;

    @IsOptional()
    @IsString()
    fullAddress?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    lastNameLocalScript?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    postalCode?: string;

    @IsOptional()
    @IsString()
    regionCode?: string;

    @IsOptional()
    @Type(() => Date)
    rtsSlaTime?: Date;

    @IsOptional()
    @Type(() => Date)
    rtsTime?: Date;

    @IsOptional()
    @Type(() => Date)
    shippingDueTime?: Date;

    @IsOptional()
    @IsString()
    shippingProvider?: string;

    @IsOptional()
    @IsString()
    shippingProviderId?: string;

    @IsOptional()
    @IsString()
    shippingType?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    trackingNumber?: string;

    @IsOptional()
    @Type(() => Date)
    ttsSlaTime?: Date;

    @IsOptional()
    @Type(() => Date)
    updateTime?: Date;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    warehouseId?: string;

    @IsOptional()
    @IsString()
    packagesId?: string;

    @IsOptional()
    @IsDate()
    createdAt?: Date;

    @IsOptional()
    @IsDate()
    updatedAt?: Date;

    @IsOptional()
    items?: TiktokOrderItemDto[];

    @IsOptional()
    @IsNumber()
    paidTime?: number;

    @IsOptional()
    @IsString()
    addressLine1?: string;
}
