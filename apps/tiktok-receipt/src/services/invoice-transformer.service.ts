import { Injectable } from '@nestjs/common';
import { LoggingService } from '@app/logging';
import { ReceiptDto } from '@app/contracts/tiktok-transformer/dto/';
import { TiktokOrderDto } from '@app/contracts/database-orderhub/tiktok_order.dto';
import { TiktokOrderItemDto } from '@app/contracts/database-orderhub/tiktok_order_item.dto';
import { SalesInvoiceDto } from '@app/contracts/database-orderhub/sales_invoice.dto';

// For now, we'll define PackageDto locally until we move it to contracts
export class PackageDto extends TiktokOrderDto {
    packageId: string;
    declare items: (TiktokOrderItemDto & { quantity: number })[];
}

export interface BusinessConfig {
    companyName: string;
    companyAddress: string;
    companyTin: string;
    vatRate: number;
    currency: string;
}

@Injectable()
export class InvoiceTransformerService {
    private readonly businessConfig: BusinessConfig = {
        companyName: 'Great Deals E-Commerce Corp',
        companyAddress: '2/F Bookman Building, 373 Quezon Avenue, Barangay Lourdes Quezon City National Capital Region Philippines 1114',
        companyTin: '009-717-682-000',
        vatRate: 0.12,
        currency: 'PHP'
    };

    constructor(private readonly logger: LoggingService) {}

    /**
     * Rounds a number up to two decimal places.
     */
    roundUpToTwoDecimals(value: number): number {
        return Math.ceil(value * 100) / 100;
    }

    /**
     * Aggregates order items to consolidate duplicates with quantities
     */
    aggregateOrderItems(items: TiktokOrderItemDto[]): (TiktokOrderItemDto & { quantity: number })[] {
        const aggregatedItems = Object.values(
            items.reduce(
                (acc, item) => {
                    const key = `${item.shopId}|${item.orderId}|${item.productId}`;
                    if (!acc[key]) {
                        acc[key] = { ...item, quantity: 1 };
                    } else {
                        acc[key].quantity += 1;
                    }
                    return acc;
                },
                {} as Record<string, TiktokOrderItemDto & { quantity: number }>
            )
        );

        return aggregatedItems;
    }

    /**
     * Transform order data into packages based on packageIds
     */
    transformToPackages(
        orderData: TiktokOrderDto & { items: (TiktokOrderItemDto & { quantity: number })[] }
    ): PackageDto[] {
        try {
            const packagesIds = orderData.packagesId ? 
                orderData.packagesId.split(',').map(id => id.trim()) : 
                ['default'];

            const packages = packagesIds
                .map(packageId => {
                    const packageItems = orderData.items.filter(item => 
                        item.packageId === packageId || 
                        (packageId === 'default' && !item.packageId)
                    ) as (TiktokOrderItemDto & { quantity: number })[];

                    if (packageItems.length > 0) {
                        const packageDto = new PackageDto();
                        Object.assign(packageDto, orderData);
                        packageDto.packageId = packageId;
                        packageDto.items = packageItems;
                        
                        return packageDto;
                    }
                    return null;
                })
                .filter((pkg): pkg is PackageDto => pkg !== null);

            this.logger.log(
                `Transformed order into ${packages.length} packages`, 
                'InvoiceTransformerService'
            );
            
            return packages;
        } catch (error) {
            this.logger.error(
                'Failed to transform order to packages', 
                error, 
                'InvoiceTransformerService'
            );
            throw error;
        }
    }

    /**
     * Map order with items to receipt DTO
     */
    mapOrderToReceiptDto(
        orderWithItems: TiktokOrderDto & { items: (TiktokOrderItemDto & { quantity: number })[] }, 
        sequenceNumber: string
    ): ReceiptDto {
        try {
            this.logger.log(
                `Mapping order to receipt DTO - Order ID: ${orderWithItems.orderId}, Items: ${orderWithItems.items?.length || 0}`, 
                'InvoiceTransformerService'
            );
            
            const items = this.transformOrderItems(orderWithItems.items);
            this.logger.log(`Transformed ${items.length} order items`, 'InvoiceTransformerService');
            
            const financials = this.calculateFinancials(orderWithItems);
            this.logger.log(`Calculated financials: ${JSON.stringify(financials)}`, 'InvoiceTransformerService');
            
            const receiptDto = {
                packages: [
                    {
                        sequence_number: sequenceNumber,
                        page_number: 1,
                        total_pages: 1,
                        billing_address: this.mapBillingAddress(orderWithItems),
                        shipping_address: this.mapShippingAddress(orderWithItems),
                        items,
                        account_name: this.businessConfig.companyName,
                        account_full_address: this.businessConfig.companyAddress,
                        account_tax_identification_number: this.businessConfig.companyTin,
                        invoice_printed_date: new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit',
                        }),
                        order_number: orderWithItems.orderId ?? '',
                        payment_method: orderWithItems.paymentMethodName ?? '',
                        ...financials
                    },
                ],
            };
            
            this.logger.log('Receipt DTO created successfully', 'InvoiceTransformerService');
            return receiptDto;
        } catch (error) {
            this.logger.error(
                `Failed to map order to receipt DTO: ${error.message}`, 
                error, 
                'InvoiceTransformerService'
            );
            throw error;
        }
    }

    private transformOrderItems(items: (TiktokOrderItemDto & { quantity: number })[]): any[] {
        return items.map((item: TiktokOrderItemDto & { quantity: number }) => ({
            shop_sku: item.sellerSku ?? '',
            variation_sku: item.skuId ?? '',
            item_name: item.productName ?? '',
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
            item_price: item.originalPrice ? Number(item.originalPrice) : 0,
            store_discount: 
                (item.sellerDiscount ? Number(item.sellerDiscount) : 0) +
                (item.platformDiscount ? Number(item.platformDiscount) : 0),
            total_actual_price: this.roundUpToTwoDecimals(
                (Number(item.originalPrice ?? 0) - 
                 (Number(item.sellerDiscount ?? 0) + Number(item.platformDiscount ?? 0))) *
                (typeof item.quantity === 'number' ? item.quantity : 1)
            )
        }));
    }

    private calculateFinancials(orderWithItems: TiktokOrderDto) {
        const amount_due = orderWithItems.subTotal ? Number(orderWithItems.subTotal) : 0;
        const vatable_sales = Math.round((amount_due / (1 + this.businessConfig.vatRate)) * 100) / 100;
        const total_discount = 0;
        const subtotal_net = vatable_sales;
        const vat_amount = Math.round(vatable_sales * this.businessConfig.vatRate * 100) / 100;

        return {
            vatable_sales,
            vat_exempt_sales: 0,
            vat_zero_rated_sales: 0,
            total_discount,
            subtotal_net,
            vat_amount,
            amount_due,
        };
    }

    private mapBillingAddress(orderWithItems: TiktokOrderDto) {
        return {
            full_name: orderWithItems.name ?? '',
            address_line1: orderWithItems.addressDetail ?? '',
            address_line2: '',
            city: orderWithItems.municipality ?? '',
            state: orderWithItems.region ?? '',
            postal_code: orderWithItems.postalCode ?? '',
            country: orderWithItems.country ?? '',
            full_address: orderWithItems.fullAddress ?? '',
            tax_identification_number: orderWithItems?.tin ?? ''
        };
    }

    private mapShippingAddress(orderWithItems: TiktokOrderDto) {
        return {
            full_name: orderWithItems.name ?? '',
            address_line1: orderWithItems.addressDetail ?? '',
            address_line2: '',
            city: orderWithItems.municipality ?? '',
            state: orderWithItems.region ?? '',
            postal_code: orderWithItems.postalCode ?? '',
            country: orderWithItems.country ?? '',
            full_address: orderWithItems.fullAddress ?? '',
        };
    }

    /**
     * Create SalesInvoiceDto from PackageDto
     */
    createSalesInvoiceDto(
        packageData: PackageDto, 
        sequenceNumber: string, 
        filePath: string, 
        receiptDto: any
    ): SalesInvoiceDto {
        try {
            const packageInvoiceData = receiptDto.packages[0];
            const salesInvoiceDto = new SalesInvoiceDto();
            
            // Basic required fields
            salesInvoiceDto.sequenceNumber = sequenceNumber;
            salesInvoiceDto.orderId = packageData.orderId;
            salesInvoiceDto.shopId = packageData.shopId;
            salesInvoiceDto.packageId = packageData.packageId;
            salesInvoiceDto.filePath = filePath;
            
            // Financial details
            salesInvoiceDto.amountDue = packageInvoiceData.amount_due.toString();
            salesInvoiceDto.vatableSales = packageInvoiceData.vatable_sales.toString();
            salesInvoiceDto.vatAmount = packageInvoiceData.vat_amount.toString();
            salesInvoiceDto.subtotalNet = packageInvoiceData.subtotal_net.toString();
            salesInvoiceDto.totalDiscount = packageInvoiceData.total_discount.toString();
            salesInvoiceDto.vatExemptSales = packageInvoiceData.vat_exempt_sales?.toString() || '0';
            salesInvoiceDto.vatZeroRatedSales = packageInvoiceData.vat_zero_rated_sales?.toString() || '0';
            salesInvoiceDto.totalNetAmount = packageInvoiceData.subtotal_net.toString();
            salesInvoiceDto.grossAmount = packageInvoiceData.amount_due.toString();
            
            // Document details
            salesInvoiceDto.pageNumber = packageInvoiceData.page_number;
            salesInvoiceDto.totalPages = packageInvoiceData.total_pages;
            salesInvoiceDto.generatedAt = new Date();
            salesInvoiceDto.invoiceDate = new Date();
            salesInvoiceDto.invoicePrintedDate = new Date();
            
            // Order and customer information
            salesInvoiceDto.orderNumber = packageInvoiceData.order_number;
            salesInvoiceDto.customerName = packageInvoiceData.billing_address?.full_name || packageInvoiceData.shipping_address?.full_name;
            salesInvoiceDto.customerTin = packageInvoiceData.billing_address?.tax_identification_number || packageInvoiceData.account_tax_identification_number;
            salesInvoiceDto.customerAddress = packageInvoiceData.billing_address?.full_address || packageInvoiceData.shipping_address?.full_address;
            salesInvoiceDto.paymentMethod = packageInvoiceData.payment_method;
            salesInvoiceDto.currency = this.businessConfig.currency;
            salesInvoiceDto.invoiceStatus = 'generated';
            
            // JSONB data for comprehensive storage
            salesInvoiceDto.invoiceContent = receiptDto;
            salesInvoiceDto.billingAddress = packageInvoiceData.billing_address;
            salesInvoiceDto.shippingAddress = packageInvoiceData.shipping_address;
            salesInvoiceDto.lineItems = packageInvoiceData.items || [];
            salesInvoiceDto.accountDetails = {
                name: packageInvoiceData.account_name,
                fullAddress: packageInvoiceData.account_full_address,
                taxIdentificationNumber: packageInvoiceData.account_tax_identification_number
            };
            salesInvoiceDto.taxDetails = {
                vatAmount: packageInvoiceData.vat_amount,
                vatableSales: packageInvoiceData.vatable_sales,
                vatExemptSales: packageInvoiceData.vat_exempt_sales || 0,
                vatZeroRatedSales: packageInvoiceData.vat_zero_rated_sales || 0,
                taxRate: `${this.businessConfig.vatRate * 100}%`,
                totalBeforeTax: packageInvoiceData.subtotal_net,
                totalAfterTax: packageInvoiceData.amount_due
            };
            
            return salesInvoiceDto;
        } catch (error) {
            this.logger.error(
                'Failed to create SalesInvoiceDto', 
                error, 
                'InvoiceTransformerService'
            );
            throw error;
        }
    }

    /**
     * Create SalesInvoiceDto directly from package data (bypassing ReceiptDto)
     */
    createSalesInvoiceDtoFromPackage(
        packageData: PackageDto, 
        sequenceNumber: string
    ): SalesInvoiceDto {
        try {
            this.logger.log(
                `Creating SalesInvoiceDto from package data - Package ID: ${packageData.packageId}, Sequence: ${sequenceNumber}`, 
                'InvoiceTransformerService'
            );

            const items = this.transformOrderItems(packageData.items);
            const financials = this.calculateFinancials(packageData);
            
            const salesInvoiceDto = new SalesInvoiceDto();
            
            // Basic required fields
            salesInvoiceDto.sequenceNumber = sequenceNumber;
            salesInvoiceDto.orderId = packageData.orderId;
            salesInvoiceDto.shopId = packageData.shopId;
            salesInvoiceDto.packageId = packageData.packageId;
            // filePath will be set after PDF generation
            
            // Financial details from calculated financials
            salesInvoiceDto.amountDue = financials.amount_due.toString();
            salesInvoiceDto.vatableSales = financials.vatable_sales.toString();
            salesInvoiceDto.vatAmount = financials.vat_amount.toString();
            salesInvoiceDto.subtotalNet = financials.subtotal_net.toString();
            salesInvoiceDto.totalDiscount = financials.total_discount.toString();
            salesInvoiceDto.vatExemptSales = financials.vat_exempt_sales?.toString() || '0';
            salesInvoiceDto.vatZeroRatedSales = financials.vat_zero_rated_sales?.toString() || '0';
            salesInvoiceDto.totalNetAmount = financials.subtotal_net.toString();
            salesInvoiceDto.grossAmount = financials.amount_due.toString();
            
            // Document details
            salesInvoiceDto.pageNumber = 1;
            salesInvoiceDto.totalPages = 1;
            salesInvoiceDto.generatedAt = new Date();
            salesInvoiceDto.invoiceDate = new Date();
            salesInvoiceDto.invoicePrintedDate = new Date();
            
            // Order and customer information
            salesInvoiceDto.orderNumber = packageData.orderId;
            salesInvoiceDto.customerName = packageData.name || '';
            salesInvoiceDto.customerTin = packageData.tin || '';
            salesInvoiceDto.customerAddress = packageData.fullAddress || '';
            salesInvoiceDto.paymentMethod = packageData.paymentMethodName || '';
            salesInvoiceDto.currency = this.businessConfig.currency;
            salesInvoiceDto.invoiceStatus = 'generated';
            
            // Structured data for template usage
            salesInvoiceDto.billingAddress = this.mapBillingAddress(packageData);
            salesInvoiceDto.shippingAddress = this.mapShippingAddress(packageData);
            salesInvoiceDto.lineItems = items;
            salesInvoiceDto.accountDetails = {
                companyName: this.businessConfig.companyName,
                companyAddress: this.businessConfig.companyAddress,
                companyTin: this.businessConfig.companyTin
            };
            salesInvoiceDto.taxDetails = {
                vatRate: this.businessConfig.vatRate,
                vatableSales: financials.vatable_sales,
                vatExemptSales: financials.vat_exempt_sales || 0,
                vatZeroRatedSales: financials.vat_zero_rated_sales || 0,
                vatAmount: financials.vat_amount
            };
            
            this.logger.log('SalesInvoiceDto created successfully from package data', 'InvoiceTransformerService');
            return salesInvoiceDto;
        } catch (error) {
            this.logger.error(
                `Failed to create SalesInvoiceDto from package data: ${error.message}`, 
                error, 
                'InvoiceTransformerService'
            );
            throw error;
        }
    }

}
