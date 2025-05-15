import { Test, TestingModule } from '@nestjs/testing';
import { TiktokTransformerController } from './tiktok-transformer.controller';
import { TiktokTransformerService } from './tiktok-transformer.service';

describe('TiktokTransformerController', () => {
  let tiktokTransformerController: TiktokTransformerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TiktokTransformerController],
      providers: [TiktokTransformerService],
    }).compile();

    tiktokTransformerController = app.get<TiktokTransformerController>(TiktokTransformerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(tiktokTransformerController.getHello()).toBe('Hello World!');
    });
  });
});
