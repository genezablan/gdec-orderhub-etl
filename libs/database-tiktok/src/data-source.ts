import { DataSource } from 'typeorm';
import { Shops } from './shops/shops.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.TIKTOK_DB_HOST,
    port: 5432,
    username: process.env.TIKTOK_DB_USERNAME,
    password: process.env.TIKTOK_DB_PASSWORD,
    database: process.env.TIKTOK_DB_NAME,
    entities: [Shops],
    migrations: [],
    synchronize: false, // true only in dev
});
