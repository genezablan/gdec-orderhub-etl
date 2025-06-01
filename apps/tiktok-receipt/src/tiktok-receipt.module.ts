import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { TiktokReceiptController } from './tiktok-receipt.controller';
import { TiktokReceiptService } from './tiktok-receipt.service';
import { DatabaseOrderhubModule, databaseConfig } from '@app/database-orderhub';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseScroogeModule } from '@app/database-scrooge';

@Module({
    imports: [
        DatabaseScroogeModule,
        DatabaseOrderhubModule,
        LoggingModule,
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
            envFilePath: ['.env'], // Load from root .env file
        }),
    ],
    controllers: [TiktokReceiptController],
    providers: [TiktokReceiptService],
})
export class TiktokReceiptModule {}
