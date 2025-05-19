import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseTiktokService } from './database-tiktok.service';

describe('DatabaseTiktokService', () => {
  let service: DatabaseTiktokService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseTiktokService],
    }).compile();

    service = module.get<DatabaseTiktokService>(DatabaseTiktokService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
