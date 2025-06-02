import { Test, TestingModule } from '@nestjs/testing';
import { TiktokController } from './tiktok.controller';
import { TiktokService } from './tiktok.service';
import { ShopsService } from '@app/database-tiktok/shops/shops.service';
import { CountersService } from '@app/database-scrooge/counters/counters.service';
import { TiktokOrderService } from '@app/database-orderhub/tiktok_order/tiktok_order.service';
import { SalesInvoiceService } from '@app/database-orderhub/sales_invoice/sales_invoice.service';

describe('TiktokController', () => {
  let controller: TiktokController;

  beforeEach(async () => {
    const mockTiktokService = {};
    const mockShopsService = {};
    const mockCountersService = {};
    const mockTiktokOrderService = {};
    const mockSalesInvoiceService = {};
    const mockTiktokTransformerClient = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiktokController],
      providers: [
        { provide: TiktokService, useValue: mockTiktokService },
        { provide: ShopsService, useValue: mockShopsService },
        { provide: CountersService, useValue: mockCountersService },
        { provide: TiktokOrderService, useValue: mockTiktokOrderService },
        { provide: SalesInvoiceService, useValue: mockSalesInvoiceService },
        { provide: 'TIKTOK_TRANSFORMER_SERVICE', useValue: mockTiktokTransformerClient },
      ],
    }).compile();

    controller = module.get<TiktokController>(TiktokController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
