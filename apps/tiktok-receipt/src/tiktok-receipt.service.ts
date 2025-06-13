import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as pug from 'pug';
import * as path from 'path';
import * as fs from 'fs';
import { ReceiptDto } from '@app/contracts/tiktok-transformer/dto/';
import { TiktokOrderDto } from '@app/contracts/database-orderhub/tiktok_order.dto';
import { TiktokOrderItemDto } from '@app/contracts/database-orderhub/tiktok_order_item.dto';
import { SalesInvoiceDto } from '@app/contracts/database-orderhub/sales_invoice.dto';
import { TiktokOrderService, SalesInvoiceService } from '@app/database-orderhub';
import { CountersService } from '@app/database-scrooge/counters/counters.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { PackageDto } from '@app/contracts/tiktok-receipt';

@Injectable()
export class TiktokReceiptService {
    private s3Client: S3Client;

    constructor(
        private readonly tiktokOrderService: TiktokOrderService,
        private readonly salesInvoiceService: SalesInvoiceService,
        private readonly counterService: CountersService,
        private readonly configService: ConfigService
    ) {
        // Initialize S3 client
        const awsRegion = this.configService.get<string>('aws.region') || process.env.AWS_REGION || 'ap-southeast-1';
        const awsAccessKeyId = this.configService.get<string>('aws.accessKeyId') || process.env.AWS_ACCESS_KEY_ID;
        const awsSecretAccessKey = this.configService.get<string>('aws.secretAccessKey') || process.env.AWS_SECRET_ACCESS_KEY;

        this.s3Client = new S3Client({
            region: awsRegion,
            credentials: {
                accessKeyId: awsAccessKeyId || '',
                secretAccessKey: awsSecretAccessKey || ''
            },
            forcePathStyle: true,
            maxAttempts: 3,
            endpoint: `https://s3.${awsRegion}.amazonaws.com`,
            requestHandler: {
                requestTimeout: 30000,
                connectionTimeout: 10000
            }
        });
    }
    getHello(): string {
        return 'Hello World!';
    }
    
    /**
     * Rounds a number up to two decimal places.
     * @param value The number to round up.
     * @returns The rounded number.
     */
    roundUpToTwoDecimals(value: number): number {
        return Math.ceil(value * 100) / 100;
    }

    renderReceiptHtml(data: pug.Options & pug.LocalsObject): string {
        console.log('__dirname:', __dirname);
        const templatePath = path.join(
            __dirname,
            'templates',
            '/b2c-sales-invoice/receipt.pug'
        );
        return pug.renderFile(templatePath, data);
    }

    async generatePdf(data: ReceiptDto, outputPath: string): Promise<void> {
        // Ensure output directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const html = this.renderReceiptHtml(data);
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-extensions',
                '--no-first-run',
                '--disable-default-apps',
                '--hide-scrollbars',
                '--mute-audio'
            ],
            headless: true
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({ path: outputPath, format: 'A4' });
        await browser.close();
    }

    async generatePdfBuffer(data: ReceiptDto): Promise<Buffer> {
        // Create a deep copy to prevent mutation of the original data object
        const dataCopy = JSON.parse(JSON.stringify(data));
        const html = this.renderReceiptHtml(dataCopy);
        
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-extensions',
                '--no-first-run',
                '--disable-default-apps',
                '--hide-scrollbars',
                '--mute-audio'
            ],
            headless: true
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfData = await page.pdf({ format: 'A4' });
        await browser.close();
        return Buffer.from(pdfData);
    }

    mapOrderWithItemsToReceiptDto(orderWithItems: TiktokOrderDto , sequenceNumber: string): ReceiptDto {
        const items = Array.isArray(orderWithItems.items)
            ? orderWithItems.items.map((item: TiktokOrderItemDto) => ({
                  shop_sku: item.sellerSku ?? '',
                  variation_sku: item.skuId ?? '',
                  item_name: item.productName ?? '',
                  quantity:
                      typeof item.quantity === 'number' ? item.quantity : 1,
                  item_price: item.originalPrice
                      ? Number(item.originalPrice)
                      : 0,
                  store_discount:
                      (item.sellerDiscount ? Number(item.sellerDiscount) : 0) +
                      (item.platformDiscount
                          ? Number(item.platformDiscount)
                          : 0),
                  total_actual_price:
                        this.roundUpToTwoDecimals(
                            (Number(item.originalPrice ?? 0) - (Number(item.sellerDiscount ?? 0) + Number(item.platformDiscount ?? 0)))
                            * (typeof item.quantity === 'number' ? item.quantity : 1)
                        )
              }))
            : [];
        // const amount_due =
        //     (orderWithItems.originalShippingFee
        //         ? Number(orderWithItems.originalShippingFee)
        //         : 0) +
        //     (orderWithItems.originalTotalProductPrice
        //         ? Number(orderWithItems.originalTotalProductPrice)
        //         : 0) -
        //     (orderWithItems.platformDiscount
        //         ? Number(orderWithItems.platformDiscount)
        //         : 0) -
        //     (orderWithItems.sellerDiscount
        //         ? Number(orderWithItems.sellerDiscount)
        //         : 0) -
        //     (orderWithItems.shippingFeeCofundedDiscount
        //         ? Number(orderWithItems.shippingFeeCofundedDiscount)
        //         : 0) -
        //     (orderWithItems.shippingFeePlatformDiscount
        //         ? Number(orderWithItems.shippingFeePlatformDiscount)
        //         : 0) -
        //     (orderWithItems.shippingFeeSellerDiscount
        //         ? Number(orderWithItems.shippingFeeSellerDiscount)
        //         : 0);
        const amount_due = orderWithItems.subTotal ? Number(orderWithItems.subTotal) : 0;
        const vatable_sales = Math.round((amount_due / 1.12) * 100) / 100;
        const total_discount = 0;
        const subtotal_net = vatable_sales;
        const vat_amount = Math.round(vatable_sales * 0.12 * 100) / 100;

        const receiptDto = {
            packages: [
                {
                    sequence_number: sequenceNumber,
                    page_number: 1,
                    total_pages: 1,
                    billing_address: {
                        full_name: orderWithItems.name ?? '',
                        address_line1: orderWithItems.addressDetail ?? '',
                        address_line2: '',
                        city: orderWithItems.municipality ?? '',
                        state: orderWithItems.region ?? '',
                        postal_code: orderWithItems.postalCode ?? '',
                        country: orderWithItems.country ?? '',
                        full_address: orderWithItems.fullAddress ?? '',
                        tax_identification_number: orderWithItems?.tin ?? ''
                    },
                    shipping_address: {
                        full_name: orderWithItems.name ?? '',
                        address_line1: orderWithItems.addressDetail ?? '',
                        address_line2: '',
                        city: orderWithItems.municipality ?? '',
                        state: orderWithItems.region ?? '',
                        postal_code: orderWithItems.postalCode ?? '',
                        country: orderWithItems.country ?? '',
                        full_address: orderWithItems.fullAddress ?? '',
                    },
                    items,
                    account_name: 'Great Deals E-Commerce Corp',
                    account_full_address:
                        '2/F Bookman Building, 373 Quezon Avenue, Barangay Lourdes Quezon City National Capital Region Philippines 1114',
                    account_tax_identification_number: '009-717-682-000',
                    invoice_printed_date: new Date().toLocaleDateString(
                        'en-US',
                        {
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit',
                        }
                    ),
                    order_number: orderWithItems.orderId ?? '',
                    payment_method: orderWithItems.paymentMethodName ?? '',
                    vatable_sales,
                    vat_exempt_sales: 0,
                    vat_zero_rated_sales: 0,
                    total_discount,
                    subtotal_net,
                    vat_amount,
                    amount_due,
                },
            ],
        };
        
        return receiptDto;
    }

    // Main business logic methods

    // 1. Fetch order data with items and aggregation
    async fetchOrderData(orderId: string, shopId: string): Promise<(TiktokOrderDto & { items: (TiktokOrderItemDto & { quantity: number })[] }) | null> {
        const orderWithItems = await this.tiktokOrderService.findOrderWithItems({
            orderId,
            shopId
        });

        if (!orderWithItems || !orderWithItems.items) {
            return null;
        }

        // Aggregate items to consolidate duplicate items with quantities
        const aggregatedItems = Object.values(
            orderWithItems.items.reduce(
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

        return {
            ...orderWithItems,
            items: aggregatedItems
        };
    }

    // 2. Transform order into packages
    transformToPackages(orderData: TiktokOrderDto & { items: (TiktokOrderItemDto & { quantity: number })[] }): PackageDto[] {
        const packagesIds = orderData.packagesId ? 
            orderData.packagesId.split(',').map(id => id.trim()) : 
            ['default'];

        return packagesIds
            .map(packageId => {
                const packageItems = orderData.items.filter(item => 
                    item.packageId === packageId || 
                    (packageId === 'default' && !item.packageId)
                ) as (TiktokOrderItemDto & { quantity: number })[];

                if (packageItems.length > 0) {
                    const packageDto = new PackageDto();
                    // Copy all order properties
                    Object.assign(packageDto, orderData);
                    // Set package-specific properties
                    packageDto.packageId = packageId;
                    packageDto.items = packageItems;
                    
                    return packageDto;
                }
                return null;
            })
            .filter((pkg): pkg is PackageDto => pkg !== null);
    }

    // 3. Process packages to generate invoices
    async processPackages(packages: PackageDto[]): Promise<void> {
        for (const packageData of packages) {
            // Check if invoice already exists for this package
            if (await this.invoiceAlreadyExists(packageData)) {
                console.log(`Invoice already exists for package ${packageData.packageId}. Skipping generation.`);
                continue;
            }

            try {
                await this.processPackageInvoice(packageData);
                console.log(`Successfully processed invoice for package ${packageData.packageId}`);
            } catch (error) {
                console.error(`Failed to process package ${packageData.packageId}:`, error);
                // Continue with other packages even if one fails
            }
        }
    }

    // Check if invoice already exists for a package
    async invoiceAlreadyExists(packageData: PackageDto): Promise<boolean> {
        const existingInvoice = await this.salesInvoiceService.findOne({
            orderId: packageData.orderId,
            shopId: packageData.shopId,
            packageId: packageData.packageId
        });
        return !!existingInvoice;
    }

    // Process a single package invoice (main orchestration)
    async processPackageInvoice(packageData: PackageDto): Promise<void> {
        const sequenceNumber = await this.generateSequenceNumber();
        const receiptDto = await this.createReceiptData(packageData, sequenceNumber);
        const filePath = await this.generateAndUploadPdf(packageData, receiptDto, sequenceNumber);
        const salesInvoiceDto = this.createSalesInvoiceDto(packageData, sequenceNumber, filePath, receiptDto);
        await this.saveSalesInvoice(salesInvoiceDto, packageData.packageId, sequenceNumber);
    }

    // Generate sequence number
    async generateSequenceNumber(): Promise<string> {
        const sequenceNumber = await this.counterService.incrementB2BSalesInvoiceNumber();
        return sequenceNumber.toString();
    }

    // Create receipt data using the service
    async createReceiptData(packageData: PackageDto, sequenceNumber: string): Promise<any> {
        return this.mapOrderWithItemsToReceiptDto(
            packageData,
            sequenceNumber
        );
    }

    // Generate PDF and upload to S3
    async generateAndUploadPdf(
        packageData: PackageDto, 
        receiptDto: any, 
        sequenceNumber: string
    ): Promise<string> {
        const pdfBuffer = await this.generatePdfBuffer(receiptDto);
        
        const bucketName = process.env.AWS_S3_BUCKET_NAME || 'gdec-orderhub-invoices';
        const stage = process.env.NODE_ENV || 'development';
        const s3Key = `${stage}/invoices/tiktok/${packageData.shopId}/${packageData.orderId}/${packageData.packageId}/${sequenceNumber}.pdf`;
        
        const filePath = await this.uploadToS3(pdfBuffer, bucketName, s3Key);
        console.log(`Successfully uploaded invoice to S3: ${filePath}`);
        
        return filePath;
    }

    // Upload to S3
    async uploadToS3(pdfBuffer: Buffer, bucketName: string, key: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ACL: 'private'
        });

        try {
            console.log(`Attempting S3 upload to bucket: ${bucketName}, key: ${key}`);
            
            await this.s3Client.send(command);
            
            // Return the S3 URL using path-style format
            const region = process.env.AWS_REGION || 'ap-southeast-1';
            const s3Url = `https://s3.${region}.amazonaws.com/${bucketName}/${key}`;
            
            console.log(`Successfully uploaded to S3: ${s3Url}`);
            return s3Url;
        } catch (error) {
            console.error('Failed to upload file to S3:', error);
            
            // If it's a DNS resolution error, try creating a new S3 client instance
            if (error.message?.includes('getaddrinfo') || error.message?.includes('EAI_AGAIN')) {
                console.log('DNS resolution error detected, attempting retry with new S3 client...');
                
                try {
                    const retryS3Client = new S3Client({
                        region: process.env.AWS_REGION || 'ap-southeast-1',
                        credentials: {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
                        },
                        forcePathStyle: true,
                        maxAttempts: 1,
                        retryMode: 'adaptive'
                    });

                    await retryS3Client.send(command);
                    
                    const region = process.env.AWS_REGION || 'ap-southeast-1';
                    const s3Url = `https://s3.${region}.amazonaws.com/${bucketName}/${key}`;
                    
                    console.log(`Successfully uploaded to S3 on retry: ${s3Url}`);
                    return s3Url;
                } catch (retryError) {
                    console.error('Retry also failed:', retryError);
                    throw new Error(`S3 upload failed even after retry: ${retryError.message}`);
                }
            }
            
            throw new Error(`S3 upload failed: ${error.message}`);
        }
    }

    // Save sales invoice to database
    async saveSalesInvoice(
        salesInvoiceDto: SalesInvoiceDto, 
        packageId: string, 
        sequenceNumber: string
    ): Promise<void> {
        try {
            await this.salesInvoiceService.create(salesInvoiceDto);
            console.log(`Saved sales invoice record for package ${packageId} with sequence number ${sequenceNumber}`);
        } catch (error) {
            console.error(`Failed to save sales invoice record for package ${packageId}:`, error);
            throw error; // Re-throw to be handled by caller
        }
    }

    // Helper method to create SalesInvoiceDto from PackageDto
    createSalesInvoiceDto(
        packageData: PackageDto, 
        sequenceNumber: string, 
        filePath: string, 
        receiptDto: any
    ): SalesInvoiceDto {
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
        salesInvoiceDto.currency = 'PHP';
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
            taxRate: '12%',
            totalBeforeTax: packageInvoiceData.subtotal_net,
            totalAfterTax: packageInvoiceData.amount_due
        };
        
        return salesInvoiceDto;
    }
}