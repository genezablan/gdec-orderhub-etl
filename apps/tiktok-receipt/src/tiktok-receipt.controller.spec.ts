import { Test, TestingModule } from '@nestjs/testing';
import { TiktokReceiptController } from './tiktok-receipt.controller';
import { TiktokReceiptService } from './tiktok-receipt.service';

describe('TiktokReceiptController', () => {
  let tiktokReceiptController: TiktokReceiptController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TiktokReceiptController],
      providers: [TiktokReceiptService],
    }).compile();

    tiktokReceiptController = app.get<TiktokReceiptController>(TiktokReceiptController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(tiktokReceiptController.getHello()).toBe('Hello World!');
    });
  });
});
