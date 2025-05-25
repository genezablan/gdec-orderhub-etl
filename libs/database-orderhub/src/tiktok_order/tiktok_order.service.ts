import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TiktokOrder } from './tiktok_order.entity';
import { TiktokOrderDto } from '@app/contracts/database-orderhub/tiktok_order.dto';

@Injectable()
export class TiktokOrderService {
    private readonly logger = new Logger(TiktokOrderService.name);
    constructor(
        @InjectRepository(TiktokOrder)
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
                    `Updating existing order: ${JSON.stringify(entity)}`
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
}
