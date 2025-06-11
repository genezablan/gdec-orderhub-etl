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

    // Enhanced invoice content storage
    @IsOptional()
    invoiceContent?: any; // Complete invoice data backup

    @IsOptional()
    billingAddress?: any; // Customer billing address

    @IsOptional() 
    shippingAddress?: any; // Customer shipping address

    @IsOptional()
    lineItems?: any; // Detailed line items with product info

    @IsOptional()
    accountDetails?: any; // Company/account information

    @IsOptional()
    taxDetails?: any; // Detailed tax calculations

    // Additional invoice metadata
    @IsOptional()
    @IsString()
    orderNumber?: string;

    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDateString()
    invoicePrintedDate?: Date;

    @IsOptional()
    @IsString()
    currency?: string;

    // VAT breakdown (enhanced)
    @IsOptional()
    @IsString()
    vatExemptSales?: string;

    @IsOptional()
    @IsString()
    vatZeroRatedSales?: string;

    // Enhanced financial totals
    @IsOptional()
    @IsString()
    totalNetAmount?: string;

    @IsOptional()
    @IsString()
    grossAmount?: string;

    // Invoice status and processing
    @IsOptional()
    @IsString()
    invoiceStatus?: string;

    @IsOptional()
    @IsString()
    processingNotes?: string;

    // Customer information
    @IsOptional()
    @IsString()
    customerName?: string;

    @IsOptional()
    @IsString()
    customerTin?: string;

    @IsOptional()
    @IsString()
    customerAddress?: string;

    // Enhanced timestamps
    @IsOptional()
    @Type(() => Date)
    @IsDateString()
    invoiceDate?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDateString()
    dueDate?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDateString()
    createdAt?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDateString()
    updatedAt?: Date;
}
