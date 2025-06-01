import { Controller, Get, Param } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TiktokOrderService } from '@app/database-orderhub';
import { SalesInvoiceService } from '@app/database-orderhub';
import { TiktokOrderDto } from '@app/contracts/database-orderhub/tiktok_order.dto';
import { TiktokOrderItemDto } from '@app/contracts/database-orderhub/tiktok_order_item.dto';
import { TiktokReceiptService } from './tiktok-receipt.service';
import { CountersService } from '@app/database-scrooge/counters/counters.service';
import { ItemsByPackageDto, PackageOrderDto } from './dto';
import * as path from 'path';

@Controller()
export class TiktokReceiptController {
    constructor(
        private readonly tiktokOrderService: TiktokOrderService,
        private readonly tiktokReceiptService: TiktokReceiptService,
        private readonly counterService: CountersService,
        private readonly salesInvoiceService: SalesInvoiceService
    ) {}

    @MessagePattern('tiktok.order_loaded')
    async handleOrderLoaded(payload: any) {
        console.log('Received tiktok.order_loaded:', payload);
        
        const orderWithItems = await this.fetchOrderWithItems(payload);
        
        if (orderWithItems && orderWithItems.items) {
            const aggregatedItems = this.aggregateItems(orderWithItems.items);
            
            // Create order with aggregated items
            const orderWithAggregatedItems = {
                ...orderWithItems,
                items: aggregatedItems
            };
            console.log('Aggregated items:', aggregatedItems);

            const itemsByPackage = this.groupItemsByPackage(orderWithAggregatedItems);
            await this.generateInvoicesForPackages(itemsByPackage, orderWithItems, payload.orderId);
        }

        console.log(orderWithItems);
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

    private async generateInvoicesForPackages(
        itemsByPackage: ItemsByPackageDto, 
        orderWithItems: TiktokOrderDto, 
        orderId: string
    ): Promise<void> {
        for (const [packageId, packageItems] of Object.entries(itemsByPackage)) {
            if (packageItems && packageItems.length > 0) {
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

        const outputPath = path.join(
            __dirname,
            '../../output',
            `receipt_${Date.now()}_${orderId}_${packageId}_${sequenceNumber}.pdf`
        );
        
        // Generate PDF
        await this.tiktokReceiptService.generatePdf(receiptDto, outputPath);
        
        // Save sales invoice details to database
        try {
            const packageData = receiptDto.packages[0]; // Get the first (and likely only) package
            await this.salesInvoiceService.create({
                sequenceNumber: sequenceNumber.toString(),
                orderId: orderWithItems.orderId,
                shopId: orderWithItems.shopId,
                packageId: packageId,
                filePath: outputPath,
                amountDue: packageData.amount_due.toString(),
                vatableSales: packageData.vatable_sales.toString(),
                vatAmount: packageData.vat_amount.toString(),
                subtotalNet: packageData.subtotal_net.toString(),
                totalDiscount: packageData.total_discount.toString(),
                pageNumber: packageData.page_number,
                totalPages: packageData.total_pages,
                generatedAt: new Date()
            });
            
            console.log(`Saved sales invoice record for package ${packageId} with sequence number ${sequenceNumber}`);
        } catch (error) {
            console.error(`Failed to save sales invoice record for package ${packageId}:`, error);
            // Don't throw the error to prevent failing the entire process
        }
        
        console.log(`Generated sales invoice for package ${packageId}: ${outputPath}`);
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
}
