#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { AppDataSource } from '../../libs/database-orderhub/src/data_source';

// Load environment variables from root .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

async function testDatabaseConnection() {
    try {
        console.log('Testing database connection with centralized configuration...');
        console.log('Database config:', {
            host: process.env.ORDERHUB_DB_HOST,
            port: process.env.ORDERHUB_DB_PORT,
            database: process.env.ORDERHUB_DB_NAME,
            username: process.env.ORDERHUB_DB_USERNAME,
        });
        
        await AppDataSource.initialize();
        console.log('✅ Database connection successful!');
        
        const queryResult = await AppDataSource.query('SELECT NOW() as current_time');
        console.log('✅ Database query test successful:', queryResult[0]);
        
        await AppDataSource.destroy();
        console.log('✅ Database connection closed successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testDatabaseConnection();
