import { Test, TestingModule } from '@nestjs/testing';
import { TiktokFetcherController } from './tiktok-fetcher.controller';
import { TiktokFetcherService } from './tiktok-fetcher.service';

describe('TiktokFetcherController', () => {
  let tiktokFetcherController: TiktokFetcherController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TiktokFetcherController],
      providers: [TiktokFetcherService],
    }).compile();

    tiktokFetcherController = app.get<TiktokFetcherController>(TiktokFetcherController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(tiktokFetcherController.getHello()).toBe('Hello World!');
    });
  });
});
