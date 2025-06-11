import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesInvoice } from './sales_invoice.entity';
import { SalesInvoiceDto } from '@app/contracts/database-orderhub/sales_invoice.dto';

@Injectable()
export class SalesInvoiceService {
    private readonly logger = new Logger(SalesInvoiceService.name);

    constructor(
        @InjectRepository(SalesInvoice, 'orderhubConnection')
        private readonly repo: Repository<SalesInvoice>
    ) {}

    async create(data: Partial<SalesInvoiceDto>): Promise<SalesInvoice | null> {
        this.logger.log(`Creating sales invoice: ${JSON.stringify(data)}`);
        try {
            return await this.repo.save({ ...data });
        } catch (error) {
            if (error?.code === '23505') {
                this.logger.warn(
                    `Duplicate key error ignored for sales invoice. Details: ${JSON.stringify({
                        orderId: data.orderId,
                        shopId: data.shopId,
                        packageId: data.packageId,
                        error: error.detail || error.message,
                    })}`
                );
                return null;
            }
            this.logger.error(
                `Error creating sales invoice: ${JSON.stringify(data)} | Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    async findOne(where: Partial<SalesInvoiceDto>): Promise<SalesInvoice | null> {
        this.logger.log(`Finding sales invoice with: ${JSON.stringify(where)}`);
        try {
            return await this.repo.findOne({ where });
        } catch (error) {
            this.logger.error(
                `Error finding sales invoice: ${JSON.stringify(where)} | Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    async findByOrder(orderId: string, shopId: string): Promise<SalesInvoice[]> {
        this.logger.log(`Finding sales invoices for order: ${orderId}, shop: ${shopId}`);
        try {
            return await this.repo.find({
                where: { orderId, shopId },
                order: { generatedAt: 'DESC' }
            });
        } catch (error) {
            this.logger.error(
                `Error finding sales invoices for order: ${orderId}, shop: ${shopId} | Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    async upsert(
        where: Partial<SalesInvoiceDto>,
        data: Partial<SalesInvoiceDto>
    ): Promise<SalesInvoice | null> {
        this.logger.log(
            `Upserting sales invoice with criteria: ${JSON.stringify(where)} and data: ${JSON.stringify(data)}`
        );
        try {
            let entity = await this.repo.findOne({ where });
            if (entity) {
                Object.assign(entity, data);
                this.logger.log(`Updating existing sales invoice: ${JSON.stringify(entity)}`);
                return await this.repo.save(entity);
            } else {
                this.logger.log(`Creating new sales invoice: ${JSON.stringify(data)}`);
                return await this.create(data);
            }
        } catch (error) {
            this.logger.error(
                `Error upserting sales invoice: ${JSON.stringify(where)} | Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    async updateSalesInvoice(id: string, updateData: any): Promise<SalesInvoice | null> {
        this.logger.log(`Updating sales invoice ${id} with data: ${JSON.stringify(updateData)}`);
        try {
            // Find the sales invoice by ID
            const existingInvoice = await this.repo.findOne({ where: { id } });
            
            if (!existingInvoice) {
                this.logger.warn(`Sales invoice not found with id: ${id}`);
                return null;
            }

            // Update billing address fields if provided
            if (updateData.billingAddress) {
                // Clone the existing billingAddress to ensure TypeORM detects changes
                const updatedBillingAddress = existingInvoice.billingAddress ? { ...existingInvoice.billingAddress } : {};

                // Update individual fields in the JSONB billingAddress object using snake_case
                if (updateData.billingAddress.fullName !== undefined) {
                    updatedBillingAddress.full_name = updateData.billingAddress.fullName;
                }
                if (updateData.billingAddress.fullAddress !== undefined) {
                    updatedBillingAddress.full_address = updateData.billingAddress.fullAddress;
                }
                if (updateData.billingAddress.taxIdentificationNumber !== undefined) {
                    updatedBillingAddress.tax_identification_number = updateData.billingAddress.taxIdentificationNumber;
                }

                // Assign the new object to trigger TypeORM change detection
                existingInvoice.billingAddress = updatedBillingAddress;
            }

            // Update the updated timestamp
            existingInvoice.updatedAt = new Date();

            // Save the updated entity
            const updatedInvoice = await this.repo.save(existingInvoice);
            this.logger.log(`Successfully updated sales invoice ${id}`);
            
            return updatedInvoice;
        } catch (error) {
            this.logger.error(
                `Error updating sales invoice ${id}: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }
}
