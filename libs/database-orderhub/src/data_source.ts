import { DataSource } from 'typeorm';
import { TiktokOrder } from './tiktok_order/tiktok_order.entity';
import { TiktokOrderItem } from './tiktok_order_item/tiktok_order_item.entity';

// Use environment variables if available, fallback to hardcoded values for dev/testing
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.ORDERHUB_DB_HOST || 'localhost',
    port: process.env.ORDERHUB_DB_PORT
        ? parseInt(process.env.ORDERHUB_DB_PORT)
        : 5432,
    username: process.env.ORDERHUB_DB_USERNAME || 'postgres',
    password: process.env.ORDERHUB_DB_PASSWORD || 'Ab7323066',
    database: process.env.ORDERHUB_DB_NAME || 'orderhub-develop',
    entities: [TiktokOrder, TiktokOrderItem],
    migrations: ['libs/database-orderhub/src/migrations/*.ts'],
    synchronize: false, // true only in dev
});
