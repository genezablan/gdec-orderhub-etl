import { DataSource } from 'typeorm';
import { Shops } from './shops/shops.entity';

// Load environment variables from root .env file
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root of monorepo
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.TIKTOK_DB_HOST,
    port: process.env.TIKTOK_DB_PORT ? parseInt(process.env.TIKTOK_DB_PORT) : 5432,
    username: process.env.TIKTOK_DB_USERNAME,
    password: process.env.TIKTOK_DB_PASSWORD,
    database: process.env.TIKTOK_DB_NAME,
    entities: [Shops],
    migrations: [],
    synchronize: false, // true only in dev
});
