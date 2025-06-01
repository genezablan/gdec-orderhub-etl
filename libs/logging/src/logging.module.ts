import { Module, Global } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
