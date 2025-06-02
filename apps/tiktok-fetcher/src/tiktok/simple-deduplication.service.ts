import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class SimpleDeduplicationService implements OnModuleInit, OnModuleDestroy {
    private redisClient: RedisClientType;
    private readonly metrics = {
        totalRequests: 0,
        cacheHits: 0,
        duplicateBlocked: 0,
        processed: 0,
    };

    async onModuleInit() {
        try {
            this.redisClient = createClient({
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    connectTimeout: 5000,
                },
                database: parseInt(process.env.REDIS_DB || '0'),
            });

            this.redisClient.on('error', (err) => {
                console.error('❌ REDIS CLIENT ERROR:', err);
            });

            this.redisClient.on('connect', () => {
                console.log('✅ REDIS: Connected successfully');
            });

            this.redisClient.on('ready', () => {
                console.log('✅ REDIS: Client ready');
            });

            this.redisClient.on('disconnect', () => {
                console.log('⚠️ REDIS: Disconnected');
            });

            console.log('🔗 REDIS: Attempting to connect...');
            await this.redisClient.connect();
            console.log('🔗 REDIS: Connection established');
            
            // Test the connection
            await this.redisClient.ping();
            console.log('🏓 REDIS: Ping successful');
        } catch (error) {
            console.error('❌ REDIS: Failed to initialize:', error);
            // Don't throw here, let the service start without Redis
        }
    }

    async onModuleDestroy() {
        if (this.redisClient) {
            await this.redisClient.quit();
            console.log('🔌 REDIS: Connection closed');
        }
    }

    async processOnce<T>(
        key: string,
        processFn: () => Promise<T>,
        ttlSeconds: number = 300 // 5 minutes default
    ): Promise<{ result: T | null; fromCache: boolean; wasDuplicate: boolean }> {
        this.metrics.totalRequests++;
        console.log(`🔍 DEDUP: Processing key: ${key}`);
        
        // If Redis is not connected, just execute the function
        if (!this.redisClient || !this.redisClient.isOpen) {
            console.log(`⚠️ DEDUP: Redis not available, executing without caching for: ${key}`);
            const result = await processFn();
            this.metrics.processed++;
            return { result, fromCache: false, wasDuplicate: false };
        }
        
        try {
            // Check if already processed
            console.log(`🔍 DEDUP: Checking cache for key: ${key}`);
            const cachedData = await this.redisClient.get(key);
            console.log(`🔍 DEDUP: Cache result for ${key}:`, cachedData ? 'HIT' : 'MISS');
            
            if (cachedData) {
                this.metrics.cacheHits++;
                console.log(`📦 DEDUP: Returning cached result for ${key}`);
                const result = JSON.parse(cachedData) as T;
                return { result, fromCache: true, wasDuplicate: false };
            }

            // Check if currently processing
            const processingKey = `processing:${key}`;
            console.log(`🔍 DEDUP: Checking processing lock: ${processingKey}`);
            const isProcessing = await this.redisClient.get(processingKey);
            console.log(`🔍 DEDUP: Processing lock result:`, isProcessing ? 'LOCKED' : 'FREE');
            
            if (isProcessing) {
                this.metrics.duplicateBlocked++;
                console.log(`⛔ DEDUP: Request blocked due to processing lock: ${key}`);
                return { result: null, fromCache: false, wasDuplicate: true };
            }

            // Mark as processing
            console.log(`🔒 DEDUP: Setting processing lock: ${processingKey}`);
            await this.redisClient.setEx(processingKey, 60, 'true'); // 1 minute processing lock
            console.log(`✅ DEDUP: Processing lock set for: ${processingKey}`);

            // Execute the function
            console.log(`⚡ DEDUP: Executing process function for: ${key}`);
            const result = await processFn();
            this.metrics.processed++;
            console.log(`✅ DEDUP: Process function completed for: ${key}`);

            // Cache the result (only cache successful results)
            console.log(`💾 DEDUP: Storing result in cache: ${key} with TTL: ${ttlSeconds}s`);
            await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(result));
            console.log(`✅ DEDUP: Result stored in cache: ${key}`);
            
            // Verify the cache was set
            const verifyCache = await this.redisClient.get(key);
            console.log(`🔍 DEDUP: Cache verification for ${key}:`, verifyCache ? 'SUCCESS' : 'FAILED');
            
            // Remove processing lock
            console.log(`🔓 DEDUP: Removing processing lock: ${processingKey}`);
            await this.redisClient.del(processingKey);
            console.log(`✅ DEDUP: Processing lock removed: ${processingKey}`);
            
            return { result, fromCache: false, wasDuplicate: false };
        } catch (error) {
            console.error(`❌ DEDUP: Error processing ${key}:`, error);
            
            // Clean up processing lock on error
            const processingKey = `processing:${key}`;
            try {
                if (this.redisClient && this.redisClient.isOpen) {
                    await this.redisClient.del(processingKey);
                    console.log(`🧹 DEDUP: Cleaned up processing lock after error: ${processingKey}`);
                }
            } catch (cleanupError) {
                console.error(`❌ DEDUP: Failed to cleanup processing lock:`, cleanupError);
            }
            
            // Don't cache errors - re-throw the original error
            throw error;
        }
    }

    getMetrics() {
        const deduplicationRate = this.metrics.totalRequests > 0 
            ? ((this.metrics.cacheHits + this.metrics.duplicateBlocked) / this.metrics.totalRequests * 100).toFixed(2)
            : '0.00';
            
        return {
            ...this.metrics,
            deduplicationRate: `${deduplicationRate}%`,
            timestamp: new Date().toISOString(),
        };
    }

    resetMetrics() {
        this.metrics.totalRequests = 0;
        this.metrics.cacheHits = 0;
        this.metrics.duplicateBlocked = 0;
        this.metrics.processed = 0;
    }
}
