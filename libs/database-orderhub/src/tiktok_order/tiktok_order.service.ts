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

    create(data: Partial<TiktokOrderDto>) {
        this.logger.log(`Creating order: ${JSON.stringify(data)}`);
        return this.repo.save({
            ...data,
        });
    }
}
