import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { TiktokReceiptController } from './tiktok-receipt.controller';
import { TiktokReceiptService } from './tiktok-receipt.service';
import { DatabaseOrderhubModule, databaseConfig } from '@app/database-orderhub';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseScroogeModule } from '@app/database-scrooge';
import { HealthService } from '@app/health';
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
    ],
    controllers: [TiktokReceiptController],
    providers: [TiktokReceiptService, HealthService],
})
export class TiktokReceiptModule {}
