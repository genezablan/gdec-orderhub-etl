import { Module } from '@nestjs/common';
import { TiktokTransformerController } from './tiktok-transformer.controller';
import { TiktokTransformerService } from './tiktok-transformer.service';
import { TransformerModule } from './transformer/transformer.module';

@Module({
  imports: [TransformerModule],
  controllers: [TiktokTransformerController],
  providers: [TiktokTransformerService],
})
export class TiktokTransformerModule {}
