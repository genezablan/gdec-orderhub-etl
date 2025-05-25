import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseScroogeService } from './database-scrooge.service';
import { CountersService } from './counters/counters.service';
import { getMongoConfig } from './mongoose.config';
import { Counter, CounterSchema } from './counters/counters.schema';

@Module({
    imports: [
        MongooseModule.forRootAsync({ useFactory: getMongoConfig }),
        MongooseModule.forFeature([
            { name: Counter.name, schema: CounterSchema },
        ]),
    ],
    providers: [DatabaseScroogeService, CountersService],
    exports: [DatabaseScroogeService, CountersService, MongooseModule],
})
export class DatabaseScroogeModule {}
