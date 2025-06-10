import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TiktokOrder } from './tiktok_order.entity';
import { TiktokOrderDto } from '@app/contracts/database-orderhub/tiktok_order.dto';

@Injectable()
export class TiktokOrderService {
    private readonly logger = new Logger(TiktokOrderService.name);    constructor(
        @InjectRepository(TiktokOrder, 'orderhubConnection')
        private readonly repo: Repository<TiktokOrder>
    ) {}

    async create(data: Partial<TiktokOrderDto>) {
        this.logger.log(`Creating order: ${JSON.stringify(data)}`);
        try {
            return await this.repo.save({ ...data });
        } catch (error) {
            if (error?.code === '23505') {
                this.logger.warn(
                    `Duplicate key error ignored for order. Details: ${JSON.stringify(
                        {
                            orderId: data.orderId,
                            shopId: data.shopId,
                            error: error.detail || error.message,
                        }
                    )}`
                );
                return null;
            }
            this.logger.error(
                `Error creating order: ${JSON.stringify(data)} | Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    async upsert(
        where: Partial<TiktokOrderDto>,
        data: Partial<TiktokOrderDto>
    ) {
        this.logger.log(
            `Upserting order with criteria: ${JSON.stringify(where)} and data: ${JSON.stringify(data)}`
        );
        try {
            let entity = await this.repo.findOne({ where });
            if (entity) {
                // Only update fields that are null or empty string in the existing order
                for (const key of Object.keys(data)) {
                    if (
                        entity[key] !== null &&
                        entity[key] !== '' &&
                        key !== 'updatedAt'
                    ) {
                        delete data[key];
                    }
                }
                Object.assign(entity, data);
                this.logger.log(
                    `Updating existing order: ${JSON.stringify(where)}`
                );
                return await this.repo.save(entity);
            } else {
                this.logger.log(`Creating new order: ${JSON.stringify(data)}`);
                return await this.repo.save({ ...data });
            }
        } catch (error) {
            this.logger.error(
                `Error upserting order: ${JSON.stringify(data)} | Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    async findOne(where: Partial<TiktokOrderDto>) {
        return this.repo.findOne({ where });
    }

    async findOrderWithItems(where: Partial<TiktokOrderDto>) {
        return this.repo.findOne({
            where: where,
            relations: ['items'],
        });
    }

    async updateUnmaskedDetails(params: {
        shopId: string;
        orderId: string;
        nameUnmasked?: string;
        addressDetailUnmasked?: string;
        tin?: string;
    }) {
        this.logger.log(`Updating unmasked details for order: ${params.shopId}_${params.orderId}`);
        
        try {
            const updateData: any = {};            if (params.nameUnmasked !== undefined) {
                updateData.name_unmasked = params.nameUnmasked;
            }
            if (params.addressDetailUnmasked !== undefined) {
                updateData.addressDetailUnmasked = params.addressDetailUnmasked;
            }
            if (params.tin !== undefined) {
                updateData.tin = params.tin;
            }
            
            updateData.updatedAt = new Date();

            const result = await this.repo.update(
                { 
                    shopId: params.shopId, 
                    orderId: params.orderId 
                },
                updateData
            );

            if (result.affected === 0) {
                throw new Error(`Order not found for shopId: ${params.shopId}, orderId: ${params.orderId}`);
            }

            return await this.repo.findOne({
                where: { 
                    shopId: params.shopId, 
                    orderId: params.orderId 
                }
            });
        } catch (error) {
            this.logger.error(
                `Error updating unmasked details: ${JSON.stringify(params)} | Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    async findOrderWithUnmaskedDetails(where: { shopId: string; orderId: string }) {
        this.logger.log(`Finding order with unmasked details: ${JSON.stringify(where)}`);
        
        try {            return await this.repo.findOne({
                where: {
                    shopId: where.shopId,
                    orderId: where.orderId
                },                select: [
                    'id',
                    'shopId', 
                    'orderId',
                    'name_unmasked',
                    'addressDetailUnmasked', 
                    'tin',
                    'updatedAt'
                ]
            });
        } catch (error) {
            this.logger.error(
                `Error finding order with unmasked details: ${JSON.stringify(where)} | Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }
}
