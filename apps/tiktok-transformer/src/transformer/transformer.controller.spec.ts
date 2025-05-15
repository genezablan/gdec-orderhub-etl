import { Test, TestingModule } from '@nestjs/testing';
import { TransformerController } from './transformer.controller';
import { TransformerService } from './transformer.service';

describe('TransformerController', () => {
  let controller: TransformerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransformerController],
      providers: [TransformerService],
    }).compile();

    controller = module.get<TransformerController>(TransformerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
