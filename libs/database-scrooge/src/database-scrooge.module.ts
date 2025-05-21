import { Module } from '@nestjs/common';
import { DatabaseScroogeService } from './database-scrooge.service';

@Module({
  providers: [DatabaseScroogeService],
  exports: [DatabaseScroogeService],
})
export class DatabaseScroogeModule {}
