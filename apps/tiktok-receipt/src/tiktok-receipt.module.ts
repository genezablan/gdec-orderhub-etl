import { Module } from '@nestjs/common';
import { TiktokReceiptController } from './tiktok-receipt.controller';
import { TiktokReceiptService } from './tiktok-receipt.service';
import { TiktokOrderService } from '@app/database-orderhub/tiktok_order/tiktok_order.service';
import { DatabaseOrderhubModule } from '@app/database-orderhub/database-orderhub.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TiktokOrder } from '@app/database-orderhub/tiktok_order/tiktok_order.entity';
import { TiktokOrderItem } from '@app/database-orderhub/tiktok_order_item/tiktok_order_item.entity';

@Module({
    imports: [
        DatabaseOrderhubModule,
        ConfigModule.forRoot({
            envFilePath: ['apps/tiktok-receipt/.env'], // Adjusted path to locate the .env file
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => {
                const dbConfig = {
                    type: 'postgres' as const,
                    host: config.get<string>('ORDERHUB_DB_HOST'),
                    port: parseInt(config.get('ORDERHUB_DB_PORT', '5432')),
                    username: config.get<string>('ORDERHUB_DB_USERNAME'),
                    password: config.get<string>('ORDERHUB_DB_PASSWORD'),
                    database: config.get<string>('ORDERHUB_DB_NAME'),
                    entities: [TiktokOrder, TiktokOrderItem],
                };
                return dbConfig;
            },
            inject: [ConfigService],
        }),
    ],
    controllers: [TiktokReceiptController],
    providers: [TiktokReceiptService],
})
export class TiktokReceiptModule {}
