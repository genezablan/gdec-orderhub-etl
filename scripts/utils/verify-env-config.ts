#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

console.log('🔍 Environment Configuration Verification');
console.log('==========================================\n');

// Database configurations
console.log('📊 OrderHub Database Configuration:');
console.log(`  Host: ${process.env.ORDERHUB_DB_HOST || 'NOT SET'}`);
console.log(`  Port: ${process.env.ORDERHUB_DB_PORT || 'NOT SET'}`);
console.log(`  Database: ${process.env.ORDERHUB_DB_NAME || 'NOT SET'}`);
console.log(`  Username: ${process.env.ORDERHUB_DB_USERNAME || 'NOT SET'}`);
console.log(`  Password: ${process.env.ORDERHUB_DB_PASSWORD ? '***SET***' : 'NOT SET'}\n`);

console.log('📊 TikTok Database Configuration:');
console.log(`  Host: ${process.env.TIKTOK_DB_HOST || 'NOT SET'}`);
console.log(`  Port: ${process.env.TIKTOK_DB_PORT || 'NOT SET'}`);
console.log(`  Database: ${process.env.TIKTOK_DB_NAME || 'NOT SET'}`);
console.log(`  Username: ${process.env.TIKTOK_DB_USERNAME || 'NOT SET'}`);
console.log(`  Password: ${process.env.TIKTOK_DB_PASSWORD ? '***SET***' : 'NOT SET'}\n`);

console.log('🍃 MongoDB Configuration:');
console.log(`  URI: ${process.env.MONGODB_SCROOGE_URI ? '***SET***' : 'NOT SET'}\n`);

console.log('🛒 TikTok API Configuration:');
console.log(`  App Key: ${process.env.TIKTOK_APP_KEY ? '***SET***' : 'NOT SET'}`);
console.log(`  App Secret: ${process.env.TIKTOK_APP_SECRET ? '***SET***' : 'NOT SET'}`);
console.log(`  Endpoint: ${process.env.TIKTOK_ENDPOINT || 'NOT SET'}`);
console.log(`  Order Search API: ${process.env.TIKTOK_ORDER_SEARCH_API || 'NOT SET'}`);
console.log(`  Order Details API: ${process.env.TIKTOK_ORDER_DETAILS_API || 'NOT SET'}\n`);

console.log('🌐 Application Configuration:');
console.log(`  Environment: ${process.env.NODE_ENV || 'NOT SET'}\n`);

// Check for required variables
const requiredVars = [
    'ORDERHUB_DB_HOST',
    'ORDERHUB_DB_NAME',
    'ORDERHUB_DB_USERNAME',
    'ORDERHUB_DB_PASSWORD',
    'TIKTOK_DB_HOST',
    'TIKTOK_DB_NAME',
    'TIKTOK_DB_USERNAME',
    'TIKTOK_DB_PASSWORD',
    'MONGODB_SCROOGE_URI',
    'TIKTOK_APP_KEY',
    'TIKTOK_APP_SECRET',
    'NODE_ENV'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set!');
} else {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.log(`  - ${varName}`));
    process.exit(1);
}
