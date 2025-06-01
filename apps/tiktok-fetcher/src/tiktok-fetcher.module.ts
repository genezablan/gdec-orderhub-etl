import { LoggingModule } from '@app/logging';
import { Module } from '@nestjs/common';
import { TiktokFetcherController } from './tiktok-fetcher.controller';
import { TiktokFetcherService } from './tiktok-fetcher.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TiktokService } from './tiktok/tiktok.service';
import { TiktokModule } from './tiktok/tiktok.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpClientService } from './http-client/http-client.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shops } from '@app/database-tiktok/shops/shops.entity';
import { DatabaseTiktokModule } from '@app/database-tiktok';
import { DatabaseScroogeModule } from '@app/database-scrooge';

@Module({
    imports: [
        DatabaseTiktokModule,
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
                    host: config.get<string>('TIKTOK_DB_HOST'),
                    port: parseInt(config.get('TIKTOK_DB_PORT', '5432')),
                    username: config.get<string>('TIKTOK_DB_USERNAME'),
                    password: config.get<string>('TIKTOK_DB_PASSWORD'),
                    database: config.get<string>('TIKTOK_DB_NAME'),
                    entities: [Shops],
                    logging: true
                };
                return dbConfig;
            },
            inject: [ConfigService],
        }),
        ClientsModule.register([
            {
                name: 'TIKTOK_TRANSFORMER_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3002,
                },
            },
        ]),
        TiktokModule,
        DatabaseScroogeModule,
    ],

    controllers: [TiktokFetcherController],
    providers: [TiktokFetcherService, TiktokService, HttpClientService],
})
export class TiktokFetcherModule {}
