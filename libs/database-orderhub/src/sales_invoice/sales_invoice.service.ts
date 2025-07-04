import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesInvoice } from './sales_invoice.entity';
import { SalesInvoiceDto, UpdateSalesInvoiceDto } from '@app/contracts/database-orderhub';

@Injectable()
export class SalesInvoiceService {
    private readonly logger = new Logger(SalesInvoiceService.name);

    constructor(
        @InjectRepository(SalesInvoice, 'orderhubConnection')
        private readonly repo: Repository<SalesInvoice>
    ) {}

    /**
     * Check if a string contains masked data (asterisks or other masking patterns)
     */
    private isMaskedData(value: string): boolean {
        if (!value || typeof value !== 'string') {
            return false;
        }
        
        // Check for common masking patterns
        return (
            value.includes('***') ||
            value.includes('****') ||
            value.includes('*****') ||
            /^\*+$/.test(value) || // Only asterisks
            /\*{3,}/.test(value) || // 3 or more consecutive asterisks
            value.includes('XXX') ||
            value.includes('XXXX') ||
            /^X+$/.test(value) || // Only X's
            value.trim() === '' || // Empty or whitespace only
            value.toLowerCase().includes('masked') ||
            value.toLowerCase().includes('hidden')
        );
    }

    /**
     * Check if the update data contains any masked fields
     */
    private containsMaskedData(updateData: UpdateSalesInvoiceDto): { hasMaskedData: boolean; maskedFields: string[] } {
        const maskedFields: string[] = [];

        if (updateData.billingAddress) {
            if (updateData.billingAddress.fullName && this.isMaskedData(updateData.billingAddress.fullName)) {
                maskedFields.push('billingAddress.fullName');
            }
            if (updateData.billingAddress.fullAddress && this.isMaskedData(updateData.billingAddress.fullAddress)) {
                maskedFields.push('billingAddress.fullAddress');
            }
            if (updateData.billingAddress.taxIdentificationNumber && this.isMaskedData(updateData.billingAddress.taxIdentificationNumber)) {
                maskedFields.push('billingAddress.taxIdentificationNumber');
            }
        }

        if (updateData.shippingAddress) {
            if (updateData.shippingAddress.fullAddress && this.isMaskedData(updateData.shippingAddress.fullAddress)) {
                maskedFields.push('shippingAddress.fullAddress');
            }
        }

        return {
            hasMaskedData: maskedFields.length > 0,
            maskedFields
        };
    }

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

    async updateSalesInvoice(id: string, updateData: UpdateSalesInvoiceDto): Promise<{ 
        invoice: SalesInvoice | null; 
        wasAlreadyUnmasked: boolean; 
        containsMaskedData: boolean;
        maskedFields: string[];
        message: string;
    }> {
        this.logger.log(`Updating sales invoice ${id} with data: ${JSON.stringify(updateData)}`);
        try {
            // Find the sales invoice by ID
            const existingInvoice = await this.repo.findOne({ where: { id } });
            
            if (!existingInvoice) {
                this.logger.warn(`Sales invoice not found with id: ${id}`);
                return {
                    invoice: null,
                    wasAlreadyUnmasked: false,
                    containsMaskedData: false,
                    maskedFields: [],
                    message: 'Sales invoice not found'
                };
            }

            // Check if the invoice is already unmasked AND we're trying to update customer data
            if (existingInvoice.isUnmasked && (updateData.billingAddress || updateData.shippingAddress)) {
                this.logger.log(`Sales invoice ${id} is already unmasked and trying to update customer data. Skipping customer data update.`);
                return {
                    invoice: existingInvoice,
                    wasAlreadyUnmasked: true,
                    containsMaskedData: false,
                    maskedFields: [],
                    message: 'Sales invoice was already unmasked - customer data update skipped'
                };
            }

            // Only check for masked data if we're updating customer data (billing/shipping addresses)
            if (updateData.billingAddress || updateData.shippingAddress) {
                const maskedDataCheck = this.containsMaskedData(updateData);
                if (maskedDataCheck.hasMaskedData) {
                    this.logger.warn(`Sales invoice ${id} update contains masked data in fields: ${maskedDataCheck.maskedFields.join(', ')}`);
                    return {
                        invoice: existingInvoice,
                        wasAlreadyUnmasked: false,
                        containsMaskedData: true,
                        maskedFields: maskedDataCheck.maskedFields,
                        message: `Update data contains masked fields: ${maskedDataCheck.maskedFields.join(', ')}`
                    };
                }
            }

            // Proceed with updating the sales invoice
            this.logger.log(`Proceeding with updating sales invoice ${id}`);

            // Track if we're updating customer data (billing/shipping addresses)
            const isUpdatingCustomerData = !!(updateData.billingAddress || updateData.shippingAddress);

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

            // Update shipping address fields if provided
            if (updateData.shippingAddress) {
                // Clone the existing shippingAddress to ensure TypeORM detects changes
                const updatedShippingAddress = existingInvoice.shippingAddress ? { ...existingInvoice.shippingAddress } : {};

                // Update individual fields in the JSONB shippingAddress object using snake_case
                if (updateData.shippingAddress.fullAddress !== undefined) {
                    updatedShippingAddress.full_address = updateData.shippingAddress.fullAddress;
                }

                // Assign the new object to trigger TypeORM change detection
                existingInvoice.shippingAddress = updatedShippingAddress;
            }

            // Update other fields if provided
            if (updateData.filePath !== undefined) {
                existingInvoice.filePath = updateData.filePath;
            }
            
            if (updateData.generatedAt !== undefined) {
                existingInvoice.generatedAt = updateData.generatedAt;
            }
            
            if (updateData.invoiceContent !== undefined) {
                existingInvoice.invoiceContent = updateData.invoiceContent;
            }

            // Only set unmasking tracking fields if we're actually updating customer data
            if (isUpdatingCustomerData) {
                existingInvoice.isUnmasked = true;
                existingInvoice.unmaskedAt = new Date();
                existingInvoice.unmaskingStatus = 'unmasked';
                this.logger.log(`Setting unmasking flags for sales invoice ${id} - customer data updated`);
            } else {
                this.logger.log(`Skipping unmasking flags for sales invoice ${id} - only system fields updated`);
            }

            // Update the updated timestamp
            existingInvoice.updatedAt = new Date();

            // Save the updated entity
            const updatedInvoice = await this.repo.save(existingInvoice);
            
            const message = isUpdatingCustomerData 
                ? 'Sales invoice successfully unmasked and updated'
                : 'Sales invoice successfully updated';
            
            this.logger.log(`${message}: ${id}`);
            
            return {
                invoice: updatedInvoice,
                wasAlreadyUnmasked: false,
                containsMaskedData: false,
                maskedFields: [],
                message
            };
        } catch (error) {
            this.logger.error(
                `Error updating sales invoice ${id}: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }
}
