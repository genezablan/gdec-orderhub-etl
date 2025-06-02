import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Shops } from './shops.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ShopsService {
    constructor(
        @InjectRepository(Shops, 'tiktokConnection')
        private readonly repo: Repository<Shops>
    ) {}

     findByTiktokShopCode(tiktok_shop_code: string): Promise<Shops | null> {
        if (!tiktok_shop_code)
            throw new BadRequestException('tiktok_shop_id is required');

        return this.repo.findOne({ where: { tiktok_shop_code } });
    }

    
    findByTiktokShopId(tiktok_shop_id: string): Promise<Shops | null> {
        if (!tiktok_shop_id)
            throw new BadRequestException('tiktok_shop_id is required');

        return this.repo.findOne({ where: { tiktok_shop_id } });
    }

    findAll(): Promise<Shops[]> {
        return this.repo.find();
    }
}
