import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseScroogeService } from './database-scrooge.service';

describe('DatabaseScroogeService', () => {
  let service: DatabaseScroogeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseScroogeService],
    }).compile();

    service = module.get<DatabaseScroogeService>(DatabaseScroogeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
