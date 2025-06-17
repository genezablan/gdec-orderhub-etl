import { Controller, Get, Param, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { SalesInvoiceService } from '@app/database-orderhub';
import { TiktokReceiptService } from './tiktok-receipt.service';
import { InvoiceTransformerService } from './services';
import { TIKTOK_FETCHER_PATTERNS } from '@app/contracts/tiktok-fetcher/tiktok-fetcher.patterns';
import { HealthService } from '@app/health';
import { OrderLoadedPayloadDto, OrderProcessingResult } from '@app/contracts';

@Controller()
export class TiktokReceiptController {
    // Define valid statuses for receipt generation
    private readonly VALID_RECEIPT_STATUSES = ['COMPLETED', 'DELIVERED'];

    constructor(
        private readonly tiktokReceiptService: TiktokReceiptService,
        private readonly salesInvoiceService: SalesInvoiceService,
        private readonly healthService: HealthService,
        private readonly invoiceTransformer: InvoiceTransformerService
    ) {}

    @MessagePattern('tiktok.order_loaded')
    async handleOrderLoaded(payload: OrderLoadedPayloadDto): Promise<OrderProcessingResult> {
        console.log('Received tiktok.order_loaded:', payload);
        
        try {
            // Validate required payload fields
            if (!payload.orderId || !payload.shopId) {
                const errorMessage = 'Invalid payload: orderId and shopId are required';
                console.error(errorMessage, payload);
                return {
                    success: false,
                    message: errorMessage,
                    orderId: payload.orderId || 'unknown',
                    shopId: payload.shopId || 'unknown'
                };
            }

            // 1. Fetch order data with items
            const orderData = await this.tiktokReceiptService.fetchOrderData(payload.orderId, payload.shopId);
            
            if (!orderData) {
                const message = `Order not found: ${payload.orderId} in shop ${payload.shopId}`;
                console.warn(message);
                return {
                    success: false,
                    message,
                    orderId: payload.orderId,
                    shopId: payload.shopId
                };
            }

            // 2. Check order status for receipt generation eligibility
            const orderStatus = orderData.status || payload.orderStatus;
            if (!orderStatus) {
                const message = `Order status not available for order ${payload.orderId}`;
                console.warn(message);
                return {
                    success: false,
                    message,
                    orderId: payload.orderId,
                    shopId: payload.shopId
                };
            }

            if (!this.isValidReceiptStatus(orderStatus)) {
                const message = `Receipt cannot be generated for order "${payload.orderId}" because its status is "${orderStatus}". Receipts can only be generated for orders with status: ${this.VALID_RECEIPT_STATUSES.join(' or ')}.`;
                console.log(message);
                return {
                    success: false,
                    message,
                    orderId: payload.orderId,
                    shopId: payload.shopId,
                    orderStatus
                };
            }

            // 3. Check if order has items
            if (!orderData.items || orderData.items.length === 0) {
                const message = `No items found for order ${payload.orderId}`;
                console.warn(message);
                return {
                    success: false,
                    message,
                    orderId: payload.orderId,
                    shopId: payload.shopId,
                    orderStatus
                };
            }

            // 4. Transform into packages
            const packages = this.invoiceTransformer.transformToPackages(orderData);
            
            if (packages.length === 0) {
                const message = `No packages could be created from order ${payload.orderId}`;
                console.warn(message);
                return {
                    success: false,
                    message,
                    orderId: payload.orderId,
                    shopId: payload.shopId,
                    orderStatus
                };
            }

            // 5. Generate receipts for each package
            await this.tiktokReceiptService.processPackages(packages);
            
            const successMessage = `Receipts generated successfully for order ${payload.orderId} with ${packages.length} package(s). Order status: ${orderStatus}`;
            console.log(successMessage);
            
            return {
                success: true,
                message: successMessage,
                packagesProcessed: packages.length,
                orderId: payload.orderId,
                shopId: payload.shopId,
                orderStatus
            };

        } catch (error) {
            const errorMessage = `Error processing order ${payload.orderId}: ${error.message}`;
            console.error(errorMessage, error);
            
            return {
                success: false,
                message: errorMessage,
                orderId: payload.orderId,
                shopId: payload.shopId
            };
        }
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

    /**
     * Validates if an order status is eligible for receipt generation
     */
    private isValidReceiptStatus(status: string): boolean {
        return this.VALID_RECEIPT_STATUSES.includes(status);
    }

    /**
     * Creates a standardized error result for order processing
     */
    private createErrorResult(
        message: string, 
        orderId: string, 
        shopId: string, 
        orderStatus?: string
    ): OrderProcessingResult {
        return {
            success: false,
            message,
            orderId,
            shopId,
            orderStatus
        };
    }

    /**
     * Creates a standardized success result for order processing
     */
    private createSuccessResult(
        message: string, 
        orderId: string, 
        shopId: string, 
        orderStatus: string,
        packagesProcessed: number
    ): OrderProcessingResult {
        return {
            success: true,
            message,
            packagesProcessed,
            orderId,
            shopId,
            orderStatus
        };
    }
}
