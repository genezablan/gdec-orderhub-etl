import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { TiktokLoaderController } from './tiktok-loader.controller';
import { TiktokLoaderService } from './tiktok-loader.service';
import { ReceiptModule } from './receipt/receipt.module';
import { OrderDetailsModule } from './order-details/order-details.module';
import { DatabaseOrderhubModule } from '@app/database-orderhub';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiktokOrder } from '@app/database-orderhub/tiktok_order/tiktok_order.entity';
import { TiktokOrderItem } from '@app/database-orderhub/tiktok_order_item/tiktok_order_item.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        DatabaseOrderhubModule,
        LoggingModule,
        ConfigModule.forRoot({
            envFilePath: ['.env'], // Load from root .env file
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
        OrderDetailsModule,
        ClientsModule.register([
            {
                name: 'TIKTOK_RECEIPT_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3004,
                },
            },
        ]),
    ],
    controllers: [TiktokLoaderController],
    providers: [TiktokLoaderService],
})
export class TiktokLoaderModule {}
