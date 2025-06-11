import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Load .env file from root directory (centralized configuration)
const dotenvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
} else {
    console.log('No .env file found, using environment variables');
}

// Clean up single quotes if present
process.env.ORDERHUB_DB_HOST = (process.env.ORDERHUB_DB_HOST || '').replace(
    /'/g,
    ''
);
process.env.ORDERHUB_DB_NAME = (process.env.ORDERHUB_DB_NAME || '').replace(
    /'/g,
    ''
);
process.env.ORDERHUB_DB_PASSWORD = (
    process.env.ORDERHUB_DB_PASSWORD || ''
).replace(/'/g, '');
process.env.ORDERHUB_DB_USERNAME = (
    process.env.ORDERHUB_DB_USERNAME || ''
).replace(/'/g, '');

const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14);
const migrationName = `Migration_${timestamp}`;

const migrationCmd = `npm run typeorm migration:generate -- ./libs/database-orderhub/src/migrations/${migrationName} -d ./libs/database-orderhub/src/data_source.ts`;

console.log('Running:', migrationCmd);
execSync(migrationCmd, { stdio: 'inherit', env: process.env });
