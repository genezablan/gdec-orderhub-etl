import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TiktokOrderItem } from './tiktok_order_item.entity';

@Injectable()
export class TiktokOrderItemService {
    private readonly logger = new Logger(TiktokOrderItemService.name);
    constructor(
        @InjectRepository(TiktokOrderItem)
        private readonly repo: Repository<TiktokOrderItem>
    ) {}

    find(where: Partial<TiktokOrderItem>) {
        this.logger.log(
            `Finding order items with criteria: ${JSON.stringify(where)}`
        );
        return this.repo.find({ where });
    }

    async findAndUpdate(
        where: Partial<TiktokOrderItem>,
        update: Partial<TiktokOrderItem>
    ) {
        this.logger.log(
            `Finding and updating order item: ${JSON.stringify(where)} with update: ${JSON.stringify(update)}`
        );
        const entity = await this.repo.findOne({ where });
        if (entity) {
            Object.assign(entity, update);
            this.logger.log(
                `Saving updated order item: ${JSON.stringify(entity)}`
            );
            return this.repo.save(entity);
        }
        this.logger.warn(
            `Order item not found for update: ${JSON.stringify(where)}`
        );
        return null;
    }

    create(data: Partial<TiktokOrderItem>) {
        this.logger.log(`Creating order item: ${JSON.stringify(data)}`);
        return this.repo.save({
            ...data,
        });
    }
}
