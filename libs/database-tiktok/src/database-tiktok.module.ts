import { Module } from '@nestjs/common';
import { DatabaseTiktokService } from './database-tiktok.service';

@Module({
  providers: [DatabaseTiktokService],
  exports: [DatabaseTiktokService],
})
export class DatabaseTiktokModule {}
