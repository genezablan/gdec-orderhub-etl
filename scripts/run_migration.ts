import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { TiktokOrder } from '../libs/database-orderhub/src/tiktok_order/tiktok_order.entity';
import { TiktokOrderItem } from '../libs/database-orderhub/src/tiktok_order_item/tiktok_order_item.entity';
import { SalesInvoice } from '../libs/database-orderhub/src/sales_invoice/sales_invoice.entity';

dotenv.config({ path: resolve(__dirname, '../.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.ORDERHUB_DB_HOST || 'localhost',
    port: process.env.ORDERHUB_DB_PORT
        ? parseInt(process.env.ORDERHUB_DB_PORT)
        : 5432,
    username: process.env.ORDERHUB_DB_USERNAME || 'postgres',
    password: process.env.ORDERHUB_DB_PASSWORD || '',
    database: process.env.ORDERHUB_DB_NAME || 'orderhub-develop',
    entities: [TiktokOrder, TiktokOrderItem, SalesInvoice],
    migrations: [resolve(__dirname, '../libs/database-orderhub/src/migrations/*.ts')],
    synchronize: false, 
    logging: process.env.NODE_ENV === 'development',
});

(async () => {
    try {
        await AppDataSource.initialize();
        console.log('DataSource initialized. Running migrations...');
        const result = await AppDataSource.runMigrations();
        console.log('Migrations complete:', result);
        await AppDataSource.destroy();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
})();
