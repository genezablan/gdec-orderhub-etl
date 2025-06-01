import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesInvoice } from './sales_invoice.entity';
import { SalesInvoiceDto } from '@app/contracts/database-orderhub/sales_invoice.dto';

@Injectable()
export class SalesInvoiceService {
    private readonly logger = new Logger(SalesInvoiceService.name);

    constructor(
        @InjectRepository(SalesInvoice)
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
}
