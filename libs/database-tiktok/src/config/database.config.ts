import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Shops } from '../shops/shops.entity';

export default registerAs(
    'tiktokDatabase',
    (): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: process.env.TIKTOK_DB_HOST || 'localhost',
        port: parseInt(process.env.TIKTOK_DB_PORT || '5432'),
        username: process.env.TIKTOK_DB_USERNAME || 'postgres',
        password: process.env.TIKTOK_DB_PASSWORD || '',
        database: process.env.TIKTOK_DB_NAME || 'tiktok-develop',
        entities: [Shops],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
        migrationsRun: false,
    })
);
