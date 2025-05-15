import { Module } from '@nestjs/common';
import { TransformerService } from './transformer.service';
import { TransformerController } from './transformer.controller';

@Module({
  controllers: [TransformerController],
  providers: [TransformerService],
})
export class TransformerModule {}
