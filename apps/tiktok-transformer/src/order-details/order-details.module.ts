import { Module } from '@nestjs/common';
import { OrderDetailsController } from './order-details.controller';
import { OrderDetailsService } from './order-details.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'TIKTOK_LOADER_SERVICE',
                transport: Transport.TCP,
                options: {
                    port: 3003,
                },
            },
        ]),
    ],
    controllers: [OrderDetailsController],
    providers: [OrderDetailsService],
    exports: [OrderDetailsService],
})
export class OrderDetailsModule {}
