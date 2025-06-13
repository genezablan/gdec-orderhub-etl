import { Controller, Get, Param, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { SalesInvoiceService } from '@app/database-orderhub';
import { TiktokReceiptService } from './tiktok-receipt.service';
import { InvoiceTransformerService } from './services';
import { TIKTOK_FETCHER_PATTERNS } from '@app/contracts/tiktok-fetcher/tiktok-fetcher.patterns';
import { HealthService } from '@app/health';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller()
export class TiktokReceiptController {
    private readonly DEDUPLICATION_TTL_SECONDS = 300; // 5 minutes

    constructor(
        private readonly tiktokReceiptService: TiktokReceiptService,
        private readonly salesInvoiceService: SalesInvoiceService,
        private readonly healthService: HealthService,
        private readonly invoiceTransformer: InvoiceTransformerService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

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
            // 1. Fetch order data with items
            const orderData = await this.tiktokReceiptService.fetchOrderData(payload.orderId, payload.shopId);
            
            if (orderData && orderData.items) {
                // 2. Transform into packages
                const packages = this.invoiceTransformer.transformToPackages(orderData);
                
                // 3. Generate receipts for each package
                await this.tiktokReceiptService.processPackages(packages);
                console.log(`Receipts generated for order ${payload.orderId} with ${packages.length} packages.`);
            }
        } catch (error) {
            console.error(`Error processing order ${payload.orderId}:`, error);
            // Remove the processing flag on error so it can be retried
            await this.cacheManager.del(deduplicationKey);
            throw error;
        }
        
        console.log(`Order ${payload.orderId} processing completed successfully.`);
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

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.UPDATE_SALES_INVOICE)
    async updateSalesInvoice(params: { id: string; updateData: any }) {
        console.log('🔥 UPDATE_SALES_INVOICE handler called with params:', params);
        try {
            console.log(`Updating sales invoice ${params.id} with data:`, params.updateData);

            // Update the sales invoice in the database
            const updatedInvoice = await this.salesInvoiceService.updateSalesInvoice(
                params.id,
                params.updateData
            );

            if (!updatedInvoice) {
                throw new RpcException(new NotFoundException(`Sales invoice not found with id: ${params.id}`));
            }

            return {
                success: true,
                message: 'Sales invoice updated successfully',
                data: updatedInvoice
            };
        } catch (error) {
            if (error instanceof RpcException) {
                throw error;
            }
            console.error('Error updating sales invoice:', error);
            throw new RpcException(new InternalServerErrorException('Failed to update sales invoice'));
        }
    }

    @Get('sales-invoices/:salesInvoiceId/reprint')
    async reprintInvoice(@Param('salesInvoiceId') salesInvoiceId: string) {
        try {
            console.log(`Reprint request for sales invoice: ${salesInvoiceId}`);
            
            // Check if the invoice can be reprinted
            const canReprint = await this.tiktokReceiptService.canReprintInvoice(salesInvoiceId);
            if (!canReprint) {
                throw new NotFoundException(`Sales invoice ${salesInvoiceId} not found or cannot be reprinted`);
            }

            // Reprint the invoice
            const newFileUrl = await this.tiktokReceiptService.reprintInvoice(salesInvoiceId);
            
            return {
                success: true,
                message: 'Invoice reprinted successfully',
                data: {
                    salesInvoiceId,
                    newFileUrl,
                    reprintedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error(`Failed to reprint sales invoice ${salesInvoiceId}:`, error);
            
            if (error instanceof NotFoundException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: 'Failed to reprint invoice',
                error: error.message,
                salesInvoiceId
            });
        }
    }

    @MessagePattern('tiktok.reprint_invoice')
    async handleReprintInvoice(payload: { salesInvoiceId: string }) {
        try {
            console.log('Received tiktok.reprint_invoice:', payload);
            
            const newFileUrl = await this.tiktokReceiptService.reprintInvoice(payload.salesInvoiceId);
            
            return {
                success: true,
                message: 'Invoice reprinted successfully',
                data: {
                    salesInvoiceId: payload.salesInvoiceId,
                    newFileUrl,
                    reprintedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error(`Failed to handle reprint invoice request:`, error);
            throw new RpcException({
                success: false,
                message: 'Failed to reprint invoice',
                error: error.message,
                salesInvoiceId: payload.salesInvoiceId
            });
        }
    }
}
