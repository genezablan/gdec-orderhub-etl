import { Test, TestingModule } from '@nestjs/testing';
import { TiktokController } from './tiktok.controller';
import { TiktokService } from './tiktok.service';
import { GetSupportOrderDetailsQueryDto } from '@app/contracts/tiktok-fetcher/dto/';
import { BadRequestException, NotFoundException, InternalServerErrorException, HttpStatus } from '@nestjs/common';

describe('TiktokController Error Handling', () => {
    let controller: TiktokController;
    let service: TiktokService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TiktokController],
            providers: [
                {
                    provide: TiktokService,
                    useValue: {
                        getSupportOrderDetails: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<TiktokController>(TiktokController);
        service = module.get<TiktokService>(TiktokService);
    });

    describe('getSupportOrderDetails error handling', () => {
        const validQuery: GetSupportOrderDetailsQueryDto = {
            shop_id: 'test_shop',
            order_id: 'test_order',
        };

        it('should throw NotFoundException when order not found', async () => {
            jest.spyOn(service, 'getSupportOrderDetails').mockRejectedValue(
                new Error('Order not found in database')
            );

            await expect(controller.getSupportOrderDetails(validQuery))
                .rejects
                .toThrow(NotFoundException);
        });

        it('should throw BadRequestException when shop does not exist', async () => {
            jest.spyOn(service, 'getSupportOrderDetails').mockRejectedValue(
                new Error('Shop do not exists')
            );

            await expect(controller.getSupportOrderDetails(validQuery))
                .rejects
                .toThrow(BadRequestException);
        });

        it('should throw InternalServerErrorException for database errors', async () => {
            jest.spyOn(service, 'getSupportOrderDetails').mockRejectedValue(
                new Error('Database connection failed')
            );

            await expect(controller.getSupportOrderDetails(validQuery))
                .rejects
                .toThrow(InternalServerErrorException);
        });

        it('should throw BadRequestException for validation errors', async () => {
            jest.spyOn(service, 'getSupportOrderDetails').mockRejectedValue(
                new Error('validation failed')
            );

            await expect(controller.getSupportOrderDetails(validQuery))
                .rejects
                .toThrow(BadRequestException);
        });

        it('should return successful result when order is found', async () => {
            const mockResult = {
                order: {
                    id: 'test_order',
                    shopId: 'test_shop',
                    status: 'completed',
                    items: []
                }
            };

            jest.spyOn(service, 'getSupportOrderDetails').mockResolvedValue(mockResult);

            const result = await controller.getSupportOrderDetails(validQuery);
            expect(result).toEqual(mockResult);
        });

        it('should throw generic InternalServerErrorException for unexpected errors', async () => {
            jest.spyOn(service, 'getSupportOrderDetails').mockRejectedValue(
                new Error('Unexpected error')
            );

            await expect(controller.getSupportOrderDetails(validQuery))
                .rejects
                .toThrow(InternalServerErrorException);
        });
    });
});
