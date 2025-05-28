import { DataSource } from 'typeorm';
import { TiktokOrder } from './tiktok_order/tiktok_order.entity';
import { TiktokOrderItem } from './tiktok_order_item/tiktok_order_item.entity';

console.log({
    type: 'postgres',
    host: process.env.ORDERHUB_DB_HOST || '',
    port: process.env.ORDERHUB_DB_PORT
        ? parseInt(process.env.ORDERHUB_DB_PORT)
        : 5432,
    username: process.env.ORDERHUB_DB_USERNAME || '',
    password: process.env.ORDERHUB_DB_PASSWORD || '',
    database: process.env.ORDERHUB_DB_NAME || 'orderhub-develop',
    migrations: ['libs/database-orderhub/src/migrations/*.ts'],
    synchronize: false, // true only in dev
});

// Use environment variables if available, fallback to hardcoded values for dev/testing
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.ORDERHUB_DB_HOST || '',
    port: process.env.ORDERHUB_DB_PORT
        ? parseInt(process.env.ORDERHUB_DB_PORT)
        : 5432,
    username: process.env.ORDERHUB_DB_USERNAME || '',
    password: process.env.ORDERHUB_DB_PASSWORD || '',
    database: process.env.ORDERHUB_DB_NAME || 'orderhub-develop',
    entities: [TiktokOrder, TiktokOrderItem],
    migrations: ['libs/database-orderhub/src/migrations/*.ts'],
    synchronize: false, // true only in dev
});
