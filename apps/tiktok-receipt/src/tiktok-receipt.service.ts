import { Injectable } from '@nestjs/common';
import { TiktokOrderDto } from '@app/contracts/database-orderhub/tiktok_order.dto';
import { TiktokOrderItemDto } from '@app/contracts/database-orderhub/tiktok_order_item.dto';
import { SalesInvoiceDto } from '@app/contracts/database-orderhub/sales_invoice.dto';
import { TiktokOrderService, SalesInvoiceService } from '@app/database-orderhub';
import { CountersService } from '@app/database-scrooge/counters/counters.service';
import { LoggingService } from '@app/logging';
import { 
    PdfGeneratorService, 
    S3UploadService, 
    InvoiceTransformerService, 
    TiktokReceiptConfigService,
    ValidationService,
    PackageDto 
} from './services';

@Injectable()
export class TiktokReceiptService {
    constructor(
        private readonly tiktokOrderService: TiktokOrderService,
        private readonly salesInvoiceService: SalesInvoiceService,
        private readonly counterService: CountersService,
        private readonly logger: LoggingService,
        private readonly pdfGenerator: PdfGeneratorService,
        private readonly s3Upload: S3UploadService,
        private readonly invoiceTransformer: InvoiceTransformerService,
        private readonly config: TiktokReceiptConfigService,
        private readonly validation: ValidationService
    ) {}

    getHello(): string {
        return 'Hello World!';
    }

    /**
     * Main entry point for processing TikTok orders into invoice packages
     */
    async processOrder(orderId: string, shopId: string): Promise<void> {
        try {
            this.validation.validateOrderInput({ orderId, shopId });
            this.logger.log(`Processing order ${orderId} for shop ${shopId}`, 'TiktokReceiptService');

            // 1. Fetch and validate order data
            const orderData = await this.fetchOrderData(orderId, shopId);
            if (!orderData) {
                this.logger.warn(`Order not found: ${orderId}`, 'TiktokReceiptService');
                return;
            }

            // 2. Transform order into packages
            const packages = this.invoiceTransformer.transformToPackages(orderData);
            if (packages.length === 0) {
                this.logger.warn(`No packages found for order: ${orderId}`, 'TiktokReceiptService');
                return;
            }

            // 3. Process each package
            await this.processPackages(packages);

            this.logger.log(
                `Successfully processed ${packages.length} packages for order ${orderId}`, 
                'TiktokReceiptService'
            );
        } catch (error) {
            this.logger.error(
                `Failed to process order ${orderId}`, 
                error, 
                'TiktokReceiptService'
            );
            throw error;
        }
    }

    /**
     * Fetch order data with items and perform aggregation
     */
    async fetchOrderData(
        orderId: string, 
        shopId: string
    ): Promise<(TiktokOrderDto & { items: (TiktokOrderItemDto & { quantity: number })[] }) | null> {
        try {
            const orderWithItems = await this.tiktokOrderService.findOrderWithItems({
                orderId,
                shopId
            });

            if (!orderWithItems || !orderWithItems.items) {
                return null;
            }

            // Aggregate items to consolidate duplicate items with quantities
            const aggregatedItems = this.invoiceTransformer.aggregateOrderItems(orderWithItems.items);

            return {
                ...orderWithItems,
                items: aggregatedItems
            };
        } catch (error) {
            this.logger.error(
                `Failed to fetch order data for ${orderId}`, 
                error, 
                'TiktokReceiptService'
            );
            throw error;
        }
    }

    /**
     * Process multiple packages to generate invoices
     */
    async processPackages(packages: PackageDto[]): Promise<void> {
        for (const packageData of packages) {
            try {
                // Check if invoice already exists for this package
                if (await this.invoiceAlreadyExists(packageData)) {
                    this.logger.log(
                        `Invoice already exists for package ${packageData.packageId}. Skipping generation.`, 
                        'TiktokReceiptService'
                    );
                    continue;
                }

                await this.processPackageInvoice(packageData);
                this.logger.log(
                    `Successfully processed invoice for package ${packageData.packageId}`, 
                    'TiktokReceiptService'
                );
            } catch (error) {
                this.logger.error(
                    `Failed to process package ${packageData.packageId}`, 
                    error, 
                    'TiktokReceiptService'
                );
                // Continue with other packages even if one fails
            }
        }
    }

    /**
     * Check if invoice already exists for a package
     */
    async invoiceAlreadyExists(packageData: PackageDto): Promise<boolean> {
        try {
            const existingInvoice = await this.salesInvoiceService.findOne({
                orderId: packageData.orderId,
                shopId: packageData.shopId,
                packageId: packageData.packageId
            });
            return !!existingInvoice;
        } catch (error) {
            this.logger.error(
                `Failed to check existing invoice for package ${packageData.packageId}`, 
                error, 
                'TiktokReceiptService'
            );
            // Return false to proceed with generation if check fails
            return false;
        }
    }

    /**
     * Process a single package invoice (main orchestration)
     */
    async processPackageInvoice(packageData: PackageDto): Promise<void> {
        try {
            // 1. Generate sequence number
            const sequenceNumber = await this.generateSequenceNumber();
            
            // 2. Create sales invoice DTO directly from package data
            const salesInvoiceDto = this.invoiceTransformer.createSalesInvoiceDtoFromPackage(
                packageData, 
                sequenceNumber
            );
            
            // 3. Generate PDF and upload to S3
            const filePath = await this.generateAndUploadPdfFromSalesInvoice(
                salesInvoiceDto
            );
            
            // 4. Update the sales invoice with the file path
            salesInvoiceDto.filePath = filePath;
            
            // 5. Save sales invoice record
            await this.saveSalesInvoice(salesInvoiceDto, packageData.packageId, sequenceNumber);
        } catch (error) {
            this.logger.error(
                `Failed to process package invoice for ${packageData.packageId}`, 
                error, 
                'TiktokReceiptService'
            );
            throw error;
        }
    }

    /**
     * Generate sequence number for invoice
     */
    async generateSequenceNumber(): Promise<string> {
        try {
            const sequenceNumber = await this.counterService.incrementB2BSalesInvoiceNumber();
            return sequenceNumber.toString();
        } catch (error) {
            this.logger.error(
                'Failed to generate sequence number', 
                error, 
                'TiktokReceiptService'
            );
            throw error;
        }
    }

    /**
     * Generate PDF and upload to S3
     */
    async generateAndUploadPdf(
        packageData: PackageDto, 
        receiptDto: any, 
        sequenceNumber: string
    ): Promise<string> {
        try {
            this.validation.validateSequenceNumber(sequenceNumber);
            
            // Generate PDF buffer
            const pdfBuffer = await this.pdfGenerator.generatePdfBuffer(receiptDto);
            this.validation.validatePdfBuffer(pdfBuffer);
            
            // Generate S3 key
            const s3Key = this.s3Upload.generateS3Key(
                packageData.shopId, 
                packageData.orderId, 
                packageData.packageId, 
                sequenceNumber
            );
            
            // Upload to S3
            const filePath = await this.s3Upload.uploadPdf(pdfBuffer, s3Key);
            
            this.logger.log(
                `Successfully uploaded invoice to S3: ${filePath}`, 
                'TiktokReceiptService'
            );
            
            return filePath;
        } catch (error) {
            this.logger.error(
                `Failed to generate and upload PDF for package ${packageData.packageId}`, 
                error, 
                'TiktokReceiptService'
            );
            throw error;
        }
    }

    /**
     * Generate PDF and upload to S3 directly from SalesInvoiceDto
     */
    async generateAndUploadPdfFromSalesInvoice(salesInvoiceDto: SalesInvoiceDto): Promise<string> {
        try {
            this.validation.validateSequenceNumber(salesInvoiceDto.sequenceNumber);
            
            // Generate PDF buffer directly from SalesInvoiceDto
            const pdfBuffer = await this.pdfGenerator.generatePdfBuffer(salesInvoiceDto);
            this.validation.validatePdfBuffer(pdfBuffer);
            
            // Generate S3 key
            const s3Key = this.s3Upload.generateS3Key(
                salesInvoiceDto.shopId, 
                salesInvoiceDto.orderId, 
                salesInvoiceDto.packageId, 
                salesInvoiceDto.sequenceNumber
            );
            
            // Upload to S3
            const filePath = await this.s3Upload.uploadPdf(pdfBuffer, s3Key);
            
            this.logger.log(
                `Successfully uploaded invoice to S3: ${filePath}`, 
                'TiktokReceiptService'
            );
            
            return filePath;
        } catch (error) {
            this.logger.error(
                `Failed to generate and upload PDF for sales invoice ${salesInvoiceDto.sequenceNumber}`, 
                error, 
                'TiktokReceiptService'
            );
            throw error;
        }
    }

    /**
     * Save sales invoice to database
     */
    async saveSalesInvoice(
        salesInvoiceDto: any, 
        packageId: string, 
        sequenceNumber: string
    ): Promise<void> {
        try {
            await this.salesInvoiceService.create(salesInvoiceDto);
            this.logger.log(
                `Saved sales invoice record for package ${packageId} with sequence number ${sequenceNumber}`, 
                'TiktokReceiptService'
            );
        } catch (error) {
            this.logger.error(
                `Failed to save sales invoice record for package ${packageId}`, 
                error, 
                'TiktokReceiptService'
            );
            throw error;
        }
    }

    /**
     * Reprint an existing sales invoice without changing the sequence number
     * @param salesInvoiceId The ID of the existing sales invoice to reprint
     * @returns The new S3 URL of the reprinted invoice
     */
    async reprintInvoice(salesInvoiceId: string): Promise<string> {
        try {
            this.validation.validateSalesInvoiceId(salesInvoiceId);
            this.logger.log(`Starting reprint for sales invoice ID: ${salesInvoiceId}`, 'TiktokReceiptService');

            // 1. Fetch the existing sales invoice
            const existingInvoice = await this.salesInvoiceService.findOne({ id: salesInvoiceId });
            if (!existingInvoice) {
                throw new Error(`Sales invoice not found with ID: ${salesInvoiceId}`);
            }

            this.logger.log(
                `Reprinting invoice with sequence number: ${existingInvoice.sequenceNumber}`, 
                'TiktokReceiptService'
            );

            // Log detailed customer information before reprint
            this.logger.log('=== REPRINT DATA DETAILS ===', 'TiktokReceiptService');
            this.logger.log(`Sales Invoice ID: ${existingInvoice.id}`, 'TiktokReceiptService');
            this.logger.log(`Sequence Number: ${existingInvoice.sequenceNumber}`, 'TiktokReceiptService');
            this.logger.log(`Customer Name: ${existingInvoice.customerName}`, 'TiktokReceiptService');
            this.logger.log(`Customer Address: ${existingInvoice.customerAddress}`, 'TiktokReceiptService');
            this.logger.log(`Customer TIN: ${existingInvoice.customerTin}`, 'TiktokReceiptService');
            this.logger.log(`Billing Address Object: ${JSON.stringify(existingInvoice.billingAddress, null, 2)}`, 'TiktokReceiptService');
            this.logger.log(`Shipping Address Object: ${JSON.stringify(existingInvoice.shippingAddress, null, 2)}`, 'TiktokReceiptService');
            this.logger.log(`Account Details: ${JSON.stringify(existingInvoice.accountDetails, null, 2)}`, 'TiktokReceiptService');
            this.logger.log(`Order Number: ${existingInvoice.orderNumber}`, 'TiktokReceiptService');
            this.logger.log(`Payment Method: ${existingInvoice.paymentMethod}`, 'TiktokReceiptService');
            this.logger.log(`Invoice Printed Date: ${existingInvoice.invoicePrintedDate}`, 'TiktokReceiptService');
            this.logger.log(`Amount Due: ${existingInvoice.amountDue}`, 'TiktokReceiptService');
            this.logger.log(`Updated At: ${existingInvoice.updatedAt}`, 'TiktokReceiptService');
            this.logger.log('=== END REPRINT DATA DETAILS ===', 'TiktokReceiptService');

            // 2. Generate new PDF directly from the sales invoice data
            const pdfBuffer = await this.pdfGenerator.generatePdfBuffer(existingInvoice);
            this.validation.validatePdfBuffer(pdfBuffer);

            // 4. Generate new S3 key for the reprint using sequence number
            const originalKey = this.extractS3KeyFromUrl(existingInvoice.filePath);
            const reprintKey = this.generateReprintS3Key(originalKey, existingInvoice.sequenceNumber);

            // 5. Upload the reprinted PDF to S3
            const newFilePath = await this.s3Upload.uploadPdf(pdfBuffer, reprintKey);

            // 6. Update the sales invoice record with new file path
            await this.updateInvoiceFilePath(salesInvoiceId, newFilePath);

            this.logger.log(
                `Successfully reprinted invoice by transforming sales invoice data. Sales Invoice ID: ${salesInvoiceId}, New file path: ${newFilePath}`,
                'TiktokReceiptService'
            );

            return newFilePath;
        } catch (error) {
            this.logger.error(
                `Failed to reprint sales invoice ID: ${salesInvoiceId}`,
                error,
                'TiktokReceiptService'
            );
            throw error;
        }
    }

    /**
     * Generate PDF for reprint using existing sequence number
     */
    /**
     * Log the reprint activity (simplified approach)
     * Note: Update method depends on the actual SalesInvoiceService interface
     */
    async logReprintActivity(invoiceId: string | number, newFilePath: string): Promise<void> {
        try {
            this.logger.log(
                `Reprint completed - Invoice ID: ${invoiceId}, New file path: ${newFilePath}`, 
                'TiktokReceiptService'
            );
            
            // TODO: Implement actual database update when service interface is available
            // This could be:
            // - Direct database query
            // - Service method call
            // - Separate audit log entry
        } catch (error) {
            this.logger.error(
                `Failed to log reprint activity for invoice ${invoiceId}`, 
                error, 
                'TiktokReceiptService'
            );
        }
    }

    /**
     * Check if a sales invoice can be reprinted
     * @param salesInvoiceId The ID of the sales invoice to check
     * @returns True if the invoice exists and can be reprinted
     */
    async canReprintInvoice(salesInvoiceId: string): Promise<boolean> {
        try {
            const existingInvoice = await this.salesInvoiceService.findOne({ id: salesInvoiceId });
            return !!existingInvoice && !!existingInvoice.invoiceContent;
        } catch (error) {
            this.logger.error(
                `Failed to check if sales invoice ${salesInvoiceId} can be reprinted`, 
                error, 
                'TiktokReceiptService'
            );
            return false;
        }
    }

    /**
     * Get existing sales invoice details
     * @param salesInvoiceId The ID of the sales invoice
     * @returns The sales invoice record or null if not found
     */
    async getExistingInvoice(salesInvoiceId: string) {
        try {
            return await this.salesInvoiceService.findOne({ id: salesInvoiceId });
        } catch (error) {
            this.logger.error(
                `Failed to fetch sales invoice ${salesInvoiceId}`, 
                error, 
                'TiktokReceiptService'
            );
            return null;
        }
    }

    /**
     * Transform order data into packages for invoice generation
     */
    transformToPackages(orderData: TiktokOrderDto & { items: (TiktokOrderItemDto & { quantity: number })[] }): PackageDto[] {
        return this.invoiceTransformer.transformToPackages(orderData);
    }

    /**
     * Extract S3 key from full S3 URL
     */
    private extractS3KeyFromUrl(s3Url: string): string {
        try {
            const url = new URL(s3Url);
            // Remove leading slash and decode URL components
            return decodeURIComponent(url.pathname.substring(1));
        } catch (error) {
            this.logger.error(`Failed to extract S3 key from URL: ${s3Url}`, error, 'TiktokReceiptService');
            throw new Error(`Invalid S3 URL format: ${s3Url}`);
        }
    }

    /**
     * Generate S3 key for reprinted invoice
     */
    private generateReprintS3Key(originalKey: string, sequenceNumber: string): string {
        const keyParts = originalKey.split('/');
        const fileName = keyParts.pop() || 'invoice.pdf';
        
        // Use cleaner naming convention: ${sequence}_reprint.pdf
        const reprintFileName = `${sequenceNumber}_reprint.pdf`;
        
        return [...keyParts, reprintFileName].join('/');
    }

    /**
     * Update the file path of an existing sales invoice
     */
    private async updateInvoiceFilePath(salesInvoiceId: string, newFilePath: string, updatedReceiptDto?: any): Promise<void> {
        try {
            this.logger.log(`Updating file path for sales invoice ${salesInvoiceId} to: ${newFilePath}`, 'TiktokReceiptService');
            
            // Prepare update data
            const updateData: any = {
                filePath: newFilePath,
                generatedAt: new Date() // Update generation timestamp
            };
            
            // Update invoice content if provided (for reprint with fresh data)
            if (updatedReceiptDto) {
                updateData.invoiceContent = updatedReceiptDto;
            }
            
            // Use the proper update method instead of creating a new record
            await this.salesInvoiceService.updateSalesInvoice(salesInvoiceId, updateData);
            
            this.logger.log(
                `Successfully updated file path for sales invoice ${salesInvoiceId}`, 
                'TiktokReceiptService'
            );
        } catch (error) {
            this.logger.error(
                `Failed to update file path for sales invoice ${salesInvoiceId}`, 
                error, 
                'TiktokReceiptService'
            );
            throw error;
        }
    }

    /**
     * Upload a buffer to S3 - delegates to S3UploadService
     * This method provides a simple interface for controllers to upload files
     */
    async uploadToS3(buffer: Buffer, bucketName: string, key: string): Promise<string> {
        try {
            this.logger.log(
                `Uploading file to S3 - Bucket: ${bucketName}, Key: ${key}`, 
                'TiktokReceiptService'
            );
            
            return await this.s3Upload.uploadPdf(buffer, key, bucketName);
        } catch (error) {
            this.logger.error(
                `Failed to upload file to S3 - Bucket: ${bucketName}, Key: ${key}`, 
                error, 
                'TiktokReceiptService'
            );
            throw error;
        }
    }
}
