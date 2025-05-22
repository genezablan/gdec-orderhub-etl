import { Test, TestingModule } from '@nestjs/testing';
import { TiktokLoaderController } from './tiktok-loader.controller';
import { TiktokLoaderService } from './tiktok-loader.service';

describe('TiktokLoaderController', () => {
  let tiktokLoaderController: TiktokLoaderController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TiktokLoaderController],
      providers: [TiktokLoaderService],
    }).compile();

    tiktokLoaderController = app.get<TiktokLoaderController>(TiktokLoaderController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(tiktokLoaderController.getHello()).toBe('Hello World!');
    });
  });
});
