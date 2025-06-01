import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseOrderhubService } from './database-orderhub.service';
import { TiktokOrderService } from './tiktok_order/tiktok_order.service';
import { TiktokOrderItemService } from './tiktok_order_item/tiktok_order_item.service';
import { SalesInvoiceService } from './sales_invoice/sales_invoice.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiktokOrder } from './tiktok_order/tiktok_order.entity';
import { TiktokOrderItem } from './tiktok_order_item/tiktok_order_item.entity';
import { SalesInvoice } from './sales_invoice/sales_invoice.entity';
import databaseConfig from './config/database.config';

@Module({
    imports: [
        ConfigModule.forFeature(databaseConfig),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => {
                const dbConfig = config.get('database');
                if (!dbConfig) {
                    throw new Error('Database configuration not found. Please check your environment variables.');
                }
                return dbConfig;
            },
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([TiktokOrder, TiktokOrderItem, SalesInvoice]),
    ],
    providers: [
        DatabaseOrderhubService,
        TiktokOrderService,
        TiktokOrderItemService,
        SalesInvoiceService,
    ],
    exports: [
        DatabaseOrderhubService,
        TiktokOrderService,
        TiktokOrderItemService,
        SalesInvoiceService,
        ConfigModule,
        TypeOrmModule,
    ],
})
export class DatabaseOrderhubModule {}
