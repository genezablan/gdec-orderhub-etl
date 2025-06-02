import { Test, TestingModule } from '@nestjs/testing';
import { TiktokController } from './tiktok.controller';
import { TiktokService } from './tiktok.service';
import { ClientProxy } from '@nestjs/microservices';

describe('TiktokController', () => {
    let controller: TiktokController;

    beforeEach(async () => {
        const mockTiktokFetcherService = {
            send: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [TiktokController],
            providers: [
                TiktokService,
                {
                    provide: 'TIKTOK_FETCHER_SERVICE',
                    useValue: mockTiktokFetcherService,
                },
            ],
        }).compile();

        controller = module.get<TiktokController>(TiktokController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
