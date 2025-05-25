import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseOrderhubService } from './database-orderhub.service';

describe('DatabaseOrderhubService', () => {
  let service: DatabaseOrderhubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseOrderhubService],
    }).compile();

    service = module.get<DatabaseOrderhubService>(DatabaseOrderhubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
