import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TiktokOrder } from '../tiktok_order/tiktok_order.entity';
import { TiktokOrderItem } from '../tiktok_order_item/tiktok_order_item.entity';
import { SalesInvoice } from '../sales_invoice/sales_invoice.entity';

export default registerAs(
    'database',
    (): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: process.env.ORDERHUB_DB_HOST || 'localhost',
        port: parseInt(process.env.ORDERHUB_DB_PORT || '5432'),
        username: process.env.ORDERHUB_DB_USERNAME || 'postgres',
        password: process.env.ORDERHUB_DB_PASSWORD || '',
        database: process.env.ORDERHUB_DB_NAME || 'orderhub-develop',
        entities: [TiktokOrder, TiktokOrderItem, SalesInvoice],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
        // Don't include migrations in the runtime configuration to avoid ES module issues
        // migrations: ['libs/database-orderhub/src/migrations/*.ts'],
        migrationsRun: false,
    })
);
