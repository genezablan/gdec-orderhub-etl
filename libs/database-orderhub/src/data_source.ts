import { DataSource } from 'typeorm';
import { TiktokOrder } from './tiktok_order/tiktok_order.entity';
import { TiktokOrderItem } from './tiktok_order_item/tiktok_order_item.entity';
import { SalesInvoice } from './sales_invoice/sales_invoice.entity';

// Load environment variables from root .env file
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root of monorepo
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Use environment variables with fallback to default values
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.ORDERHUB_DB_HOST || 'localhost',
    port: process.env.ORDERHUB_DB_PORT
        ? parseInt(process.env.ORDERHUB_DB_PORT)
        : 5432,
    username: process.env.ORDERHUB_DB_USERNAME || 'postgres',
    password: process.env.ORDERHUB_DB_PASSWORD || '',
    database: process.env.ORDERHUB_DB_NAME || 'orderhub-develop',    entities: [TiktokOrder, TiktokOrderItem, SalesInvoice],
    migrations: [path.resolve(__dirname, 'migrations/*.ts')],
    migrationsRun: false,
    synchronize: false, // Should be false in production
    logging: process.env.NODE_ENV === 'development',
});
