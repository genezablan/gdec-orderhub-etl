import { Controller, Get, Param, Inject } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TiktokOrderService } from '@app/database-orderhub';
import { SalesInvoiceService } from '@app/database-orderhub';
import { TiktokOrderDto } from '@app/contracts/database-orderhub/tiktok_order.dto';
import { TiktokOrderItemDto } from '@app/contracts/database-orderhub/tiktok_order_item.dto';
import { TiktokReceiptService } from './tiktok-receipt.service';
import { CountersService } from '@app/database-scrooge/counters/counters.service';
import { ItemsByPackageDto, PackageOrderDto } from './dto';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { HealthService } from '@app/health';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller()
export class TiktokReceiptController {
    private s3Client: S3Client;
    private readonly DEDUPLICATION_TTL_SECONDS = 300; // 5 minutes

    constructor(
        private readonly tiktokOrderService: TiktokOrderService,
        private readonly tiktokReceiptService: TiktokReceiptService,
        private readonly counterService: CountersService,
        private readonly salesInvoiceService: SalesInvoiceService,
        private readonly configService: ConfigService,
        private readonly healthService: HealthService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {
        // Get AWS configuration from config service
        const awsRegion = this.configService.get<string>('aws.region') || process.env.AWS_REGION || 'ap-southeast-1';
        const awsAccessKeyId = this.configService.get<string>('aws.accessKeyId') || process.env.AWS_ACCESS_KEY_ID;
        const awsSecretAccessKey = this.configService.get<string>('aws.secretAccessKey') || process.env.AWS_SECRET_ACCESS_KEY;

        // Log environment variables for debugging
        console.log('S3 Configuration Debug:', {
            region: awsRegion,
            hasAccessKey: !!awsAccessKeyId,
            hasSecretKey: !!awsSecretAccessKey,
            bucketName: this.configService.get<string>('aws.bucketName') || process.env.AWS_S3_BUCKET_NAME
        });

        // Initialize S3 client with environment variables
        this.s3Client = new S3Client({
            region: awsRegion,
            credentials: {
                accessKeyId: awsAccessKeyId || '',
                secretAccessKey: awsSecretAccessKey || ''
            },
            forcePathStyle: true, // Use path-style URLs instead of virtual-hosted-style
            maxAttempts: 3, // Add retry logic
            endpoint: `https://s3.${awsRegion}.amazonaws.com`, // Explicit endpoint
            requestHandler: {
                // Add timeout configurations
                requestTimeout: 30000,
                connectionTimeout: 10000
            }
        });
    }

    @MessagePattern('tiktok.order_loaded')
    async handleOrderLoaded(payload: any) {
        console.log('Received tiktok.order_loaded:', payload);
        
        // Create a unique key for deduplication
        const deduplicationKey = `tiktok_order_processing:${payload.shopId}:${payload.orderId}`;
        
        // Check if this order is already being processed
        const isProcessing = await this.cacheManager.get(deduplicationKey);
        
        if (isProcessing) {
            console.log(`Order ${payload.orderId} for shop ${payload.shopId} is already being processed. Skipping duplicate request.`);
            return;
        }
        
        // Set the processing flag with TTL
        await this.cacheManager.set(deduplicationKey, true, this.DEDUPLICATION_TTL_SECONDS * 1000);
        
        try {
            const orderWithItems = await this.fetchOrderWithItems(payload);
            
            if (orderWithItems && orderWithItems.items) {
                const aggregatedItems = this.aggregateItems(orderWithItems.items);
                
                // Create order with aggregated items
                const orderWithAggregatedItems = {
                    ...orderWithItems,
                    items: aggregatedItems
                };
                const itemsByPackage = this.groupItemsByPackage(orderWithAggregatedItems);
                await this.generateInvoicesForPackages(itemsByPackage, orderWithItems, payload.orderId);
                console.log(`Invoices generated for order ${payload.orderId} with ${Object.keys(itemsByPackage).length} packages.`);
            }
        } catch (error) {
            console.error(`Error processing order ${payload.orderId}:`, error);
            // Remove the processing flag on error so it can be retried
            await this.cacheManager.del(deduplicationKey);
            throw error;
        }
        
        console.log(`Order ${payload.orderId} processing completed successfully.`);
    }

    private async fetchOrderWithItems(payload: any): Promise<TiktokOrderDto | null> {
        return await this.tiktokOrderService.findOrderWithItems({
            orderId: payload.orderId,
            shopId: payload.shopId,
        });
    }

    private aggregateItems(items: TiktokOrderItemDto[]): (TiktokOrderItemDto & { quantity: number })[] {
        const aggregated = Object.values(
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
        return aggregated;
    }

    private groupItemsByPackage(orderWithItems: TiktokOrderDto & { items: (TiktokOrderItemDto & { quantity: number })[] }): ItemsByPackageDto {
        const packagesIds = orderWithItems.packagesId ? 
            orderWithItems.packagesId.split(',').map(id => id.trim()) : 
            ['default'];

        return packagesIds.reduce((acc, packageId) => {
            acc[packageId] = orderWithItems.items.filter((item): item is TiktokOrderItemDto & { quantity: number } => 
                item.packageId === packageId || 
                (packageId === 'default' && !item.packageId)
            );
            return acc;
        }, {} as ItemsByPackageDto);
    }

    private async uploadToS3(pdfBuffer: Buffer, bucketName: string, key: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ACL: 'private' // Adjust based on your security requirements
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
            console.error('S3 Configuration:', {
                region: process.env.AWS_REGION,
                bucketName,
                key,
                hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
                errorMessage: error.message,
                errorCode: error.code,
                errorName: error.name
            });

            // If it's a DNS resolution error, try creating a new S3 client instance
            if (error.message?.includes('getaddrinfo') || error.message?.includes('EAI_AGAIN')) {
                console.log('DNS resolution error detected, attempting retry with new S3 client...');
                
                try {
                    // Create a new S3 client instance with different configuration
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

    private async generateInvoicesForPackages(
        itemsByPackage: ItemsByPackageDto, 
        orderWithItems: TiktokOrderDto, 
        orderId: string
    ): Promise<void> {
        for (const [packageId, packageItems] of Object.entries(itemsByPackage)) {
            if (packageItems && packageItems.length > 0) {
                // Check if invoice already exists for this package
                const existingInvoice = await this.salesInvoiceService.findOne({
                    orderId: orderId,
                    shopId: orderWithItems.shopId,
                    packageId: packageId
                });

                if (existingInvoice) {
                    console.log(`Invoice already exists for package ${packageId} (sequence: ${existingInvoice.sequenceNumber}). Skipping generation.`);
                    continue;
                }

                await this.generateInvoiceForPackage(packageId, packageItems, orderWithItems, orderId);
            }
        }
    }

    private async generateInvoiceForPackage(
        packageId: string,
        packageItems: (TiktokOrderItemDto & { quantity: number })[],
        orderWithItems: TiktokOrderDto,
        orderId: string
    ): Promise<void> {
        const sequenceNumber = await this.counterService.incrementB2BSalesInvoiceNumber();
        
        // Create a proper PackageOrderDto with all required TiktokOrderDto properties
        const packageOrderData: PackageOrderDto = {
            // Copy all properties from the original order
            ...orderWithItems,
            // Override items with package-specific items including quantity
            items: packageItems,
            // Add package-specific property
            packageId: packageId
        };

        const receiptDto = this.tiktokReceiptService.mapOrderWithItemsToReceiptDto(
            packageOrderData as TiktokOrderDto,
            sequenceNumber.toString()
        );

        // Generate PDF as buffer
        const pdfBuffer = await this.tiktokReceiptService.generatePdfBuffer(receiptDto);
        
        // Upload directly to S3
        let finalFilePath: string;
        try {
            const bucketName = process.env.AWS_S3_BUCKET_NAME || 'gdec-orderhub-invoices';
            const stage = process.env.NODE_ENV || 'development';
            const s3Key = `${stage}/invoices/tiktok/${orderWithItems.shopId}/${orderId}/${packageId}/${sequenceNumber}.pdf`;
            
            finalFilePath = await this.uploadToS3(pdfBuffer, bucketName, s3Key);
            console.log(`Successfully uploaded invoice to S3: ${finalFilePath}`);
        } catch (s3Error) {
            console.error(`Failed to upload to S3: ${s3Error.message}`);
            throw new Error(`Unable to store invoice: ${s3Error.message}`);
        }
        
        // Save sales invoice details to database with comprehensive data
        try {
            const packageData = receiptDto.packages[0]; // Get the first (and likely only) package
            
            // Extract comprehensive invoice data
            const invoiceData = {
                // Basic required fields
                sequenceNumber: sequenceNumber.toString(),
                orderId: orderWithItems.orderId,
                shopId: orderWithItems.shopId,
                packageId: packageId,
                filePath: finalFilePath,
                
                // Financial details
                amountDue: packageData.amount_due.toString(),
                vatableSales: packageData.vatable_sales.toString(),
                vatAmount: packageData.vat_amount.toString(),
                subtotalNet: packageData.subtotal_net.toString(),
                totalDiscount: packageData.total_discount.toString(),
                vatExemptSales: packageData.vat_exempt_sales?.toString() || '0',
                vatZeroRatedSales: packageData.vat_zero_rated_sales?.toString() || '0',
                totalNetAmount: packageData.subtotal_net.toString(),
                grossAmount: packageData.amount_due.toString(),
                
                // Document details
                pageNumber: packageData.page_number,
                totalPages: packageData.total_pages,
                generatedAt: new Date(),
                invoiceDate: new Date(),
                invoicePrintedDate: new Date(),
                
                // Order and customer information from package data
                orderNumber: packageData.order_number,
                customerName: packageData.billing_address?.full_name || packageData.shipping_address?.full_name,
                customerTin: packageData.billing_address?.tax_identification_number || packageData.account_tax_identification_number,
                customerAddress: packageData.billing_address?.full_address || packageData.shipping_address?.full_address,
                paymentMethod: packageData.payment_method,
                currency: 'PHP', // Default currency
                invoiceStatus: 'generated',
                
                // JSONB data for comprehensive storage
                invoiceContent: receiptDto, // Complete receipt data
                billingAddress: packageData.billing_address,
                shippingAddress: packageData.shipping_address,
                lineItems: packageData.items || [],
                accountDetails: {
                    name: packageData.account_name,
                    fullAddress: packageData.account_full_address,
                    taxIdentificationNumber: packageData.account_tax_identification_number
                },
                taxDetails: {
                    vatAmount: packageData.vat_amount,
                    vatableSales: packageData.vatable_sales,
                    vatExemptSales: packageData.vat_exempt_sales || 0,
                    vatZeroRatedSales: packageData.vat_zero_rated_sales || 0,
                    taxRate: '12%', // Standard Philippine VAT
                    totalBeforeTax: packageData.subtotal_net,
                    totalAfterTax: packageData.amount_due
                }
            };
            
            await this.salesInvoiceService.create(invoiceData);
            
            console.log(`Saved sales invoice record for package ${packageId} with sequence number ${sequenceNumber}`);
        } catch (error) {
            console.error(`Failed to save sales invoice record for package ${packageId}:`, error);
            // Don't throw the error to prevent failing the entire process
        }
        
        console.log(`Generated sales invoice for package ${packageId}: ${finalFilePath}`);
    }

    @Get('health')
    getHealth() {
        return this.healthService.getHealthStatus('tiktok-receipt');
    }

    @Get('sales-invoices/:orderId/:shopId')
    async getSalesInvoices(
        @Param('orderId') orderId: string,
        @Param('shopId') shopId: string
    ) {
        try {
            const invoices = await this.salesInvoiceService.findByOrder(orderId, shopId);
            return {
                success: true,
                data: invoices,
                count: invoices.length
            };
        } catch (error) {
            console.error(`Failed to retrieve sales invoices for order ${orderId}:`, error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    @Get('debug/s3-config')
    async debugS3Config() {
        console.log('Debug S3 Configuration endpoint called');
        
        return {
            status: 'S3 Configuration Debug',
            region: process.env.AWS_REGION,
            hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
            bucketName: process.env.AWS_S3_BUCKET_NAME,
            accessKeyPrefix: process.env.AWS_ACCESS_KEY_ID?.substring(0, 4) + '***',
            timestamp: new Date().toISOString()
        };
    }

    @Get('debug/test-s3-upload')
    async testS3Upload() {
        console.log('Test S3 upload endpoint called');
        
        try {
            const testBuffer = Buffer.from('Test content for S3 upload from NestJS controller');
            const bucketName = process.env.AWS_S3_BUCKET_NAME || 'gdec-orderhub-invoices';
            const stage = process.env.NODE_ENV || 'development';
            const key = `${stage}/debug/test-upload-${Date.now()}.txt`;
            
            const result = await this.uploadToS3(testBuffer, bucketName, key);
            
            return {
                status: 'success',
                message: 'S3 upload test successful',
                url: result,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('S3 upload test failed:', error);
            return {
                status: 'error',
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    @Get('debug/deduplication/:shopId/:orderId')
    async checkDeduplicationStatus(
        @Param('shopId') shopId: string,
        @Param('orderId') orderId: string
    ) {
        const deduplicationKey = `tiktok_order_processing:${shopId}:${orderId}`;
        const isProcessing = await this.cacheManager.get(deduplicationKey);
        const ttl = await this.cacheManager.ttl?.(deduplicationKey) || 'N/A';
        
        return {
            key: deduplicationKey,
            isProcessing: !!isProcessing,
            ttl: ttl,
            timestamp: new Date().toISOString()
        };
    }
}
