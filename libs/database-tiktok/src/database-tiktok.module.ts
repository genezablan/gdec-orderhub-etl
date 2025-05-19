import { Module } from '@nestjs/common';
import { DatabaseTiktokService } from './database-tiktok.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shops } from './shops/shops.entity';
import { ShopsService } from './shops/shops.service';

@Module({
    imports: [TypeOrmModule.forFeature([Shops])],
    providers: [DatabaseTiktokService, ShopsService],
    exports: [DatabaseTiktokService, ShopsService],
})
export class DatabaseTiktokModule {}
