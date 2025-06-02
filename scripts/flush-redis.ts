#!/usr/bin/env ts-node

import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function flushRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    console.log('🔗 Connecting to Redis...');
    console.log(`📍 Redis URL: ${redisUrl}`);
    
    const client = createClient({
        url: redisUrl,
        socket: {
            connectTimeout: 5000
        }
    });

    try {
        // Connect to Redis
        await client.connect();
        console.log('✅ Connected to Redis successfully');

        // Get current database info
        const info = await client.info('keyspace');
        console.log('📊 Current keyspace info:');
        console.log(info || 'No keys found');

        // Count keys before flushing
        const keyCount = await client.dbSize();
        console.log(`🔢 Total keys before flush: ${keyCount}`);

        if (keyCount === 0) {
            console.log('ℹ️  No keys to flush');
            return;
        }

        // Ask for confirmation
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise<string>((resolve) => {
            readline.question(`❓ Are you sure you want to flush all ${keyCount} Redis keys? (y/N): `, resolve);
        });

        readline.close();

        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('❌ Operation cancelled');
            return;
        }

        // Flush all keys
        console.log('🗑️  Flushing all Redis keys...');
        await client.flushDb();
        
        // Verify flush
        const newKeyCount = await client.dbSize();
        console.log(`✅ Redis flush completed successfully`);
        console.log(`🔢 Total keys after flush: ${newKeyCount}`);
        
        if (newKeyCount === 0) {
            console.log('🎉 All keys have been successfully removed');
        } else {
            console.log('⚠️  Warning: Some keys may still exist');
        }

    } catch (error) {
        console.error('❌ Error flushing Redis:', error);
        process.exit(1);
    } finally {
        // Close connection
        if (client.isOpen) {
            await client.disconnect();
            console.log('🔌 Disconnected from Redis');
        }
    }
}

// Handle script execution
if (require.main === module) {
    flushRedis()
        .then(() => {
            console.log('🏁 Script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

export { flushRedis };
