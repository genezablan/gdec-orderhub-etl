import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { TiktokReceiptController } from './tiktok-receipt.controller';
import { TiktokReceiptService } from './tiktok-receipt.service';
import { DatabaseOrderhubModule, databaseConfig } from '@app/database-orderhub';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseScroogeModule } from '@app/database-scrooge';
import { HealthService } from '@app/health';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import awsConfig from './config/aws.config';

@Module({
    imports: [
        DatabaseScroogeModule,
        DatabaseOrderhubModule,
        LoggingModule,
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig, awsConfig],
            envFilePath: ['.env'], // Load from root .env file
        }),
        CacheModule.registerAsync({
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                store: redisStore,
                host: configService.get('REDIS_HOST') || 'localhost',
                port: configService.get('REDIS_PORT') || 6379,
                password: configService.get('REDIS_PASSWORD'),
                db: configService.get('REDIS_DB') || 0,
                ttl: 600, // Default TTL of 10 minutes
            }),
        }),
    ],
    controllers: [TiktokReceiptController],
    providers: [TiktokReceiptService, HealthService],
})
export class TiktokReceiptModule {}
