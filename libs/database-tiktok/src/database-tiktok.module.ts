import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseTiktokService } from './database-tiktok.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shops } from './shops/shops.entity';
import { ShopsService } from './shops/shops.service';
import databaseConfig from './config/database.config';

@Module({
    imports: [
        ConfigModule.forFeature(databaseConfig),
        TypeOrmModule.forRootAsync({
            name: 'tiktokConnection', // Named connection to avoid conflicts
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => {
                const dbConfig = config.get('tiktokDatabase');
                if (!dbConfig) {
                    throw new Error('TikTok database configuration not found. Please check your environment variables.');
                }
                return dbConfig;
            },
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([Shops], 'tiktokConnection'),
    ],
    providers: [DatabaseTiktokService, ShopsService],
    exports: [DatabaseTiktokService, ShopsService, ConfigModule, TypeOrmModule],
})
export class DatabaseTiktokModule {}
