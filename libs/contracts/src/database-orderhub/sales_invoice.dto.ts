import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class SalesInvoiceDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsString()
    sequenceNumber: string;

    @IsString()
    orderId: string;

    @IsString()
    shopId: string;

    @IsString()
    packageId: string;

    @IsString()
    filePath: string;

    @IsOptional()
    @IsString()
    amountDue?: string;

    @IsOptional()
    @IsString()
    vatableSales?: string;

    @IsOptional()
    @IsString()
    vatAmount?: string;

    @IsOptional()
    @IsString()
    subtotalNet?: string;

    @IsOptional()
    @IsString()
    totalDiscount?: string;

    @IsOptional()
    @IsNumber()
    pageNumber?: number;

    @IsOptional()
    @IsNumber()
    totalPages?: number;

    @IsOptional()
    @Type(() => Date)
    @IsDateString()
    generatedAt?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDateString()
    createdAt?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDateString()
    updatedAt?: Date;
}
