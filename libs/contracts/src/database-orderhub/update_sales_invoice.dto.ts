import { IsString, IsOptional, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class BillingAddressUpdateDto {
    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    fullAddress?: string;

    @IsOptional()
    @IsString()
    taxIdentificationNumber?: string;
}

export class ShippingAddressUpdateDto {
    @IsOptional()
    @IsString()
    fullAddress?: string;
}

export class UpdateSalesInvoiceDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => BillingAddressUpdateDto)
    billingAddress?: BillingAddressUpdateDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => ShippingAddressUpdateDto)
    shippingAddress?: ShippingAddressUpdateDto;

    @IsOptional()
    @IsString()
    filePath?: string;

    @IsOptional()
    @IsDateString()
    generatedAt?: Date;

    @IsOptional()
    invoiceContent?: any; // Keep as any since it's JSONB with flexible structure
}
