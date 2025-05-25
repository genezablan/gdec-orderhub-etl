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
}
