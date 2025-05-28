import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../apps/tiktok-loader/.env') });

import { AppDataSource } from '../libs/database-orderhub/src/data_source';
// Load .env file from tiktok-loader

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
