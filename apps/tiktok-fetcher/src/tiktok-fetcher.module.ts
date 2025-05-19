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

@Module({
    imports: [
        DatabaseTiktokModule,
        ConfigModule.forRoot({
            envFilePath: ['apps/tiktok-fetcher/.env'], // Adjusted path to locate the .env file
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
                };
                return dbConfig;
            },
            inject: [ConfigService],
        }),
        ClientsModule.register([
            {
                name: 'TIKTOK_FETCHER_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3001,
                },
            },
            {
                name: 'TIKTOK_TRANSFORMER_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3002,
                },
            },
        ]),
        TiktokModule,
    ],

    controllers: [TiktokFetcherController],
    providers: [TiktokFetcherService, TiktokService, HttpClientService],
})
export class TiktokFetcherModule {}
