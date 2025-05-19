import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TiktokService } from './tiktok.service';
import { TIKTOK_FETCHER_PATTERNS } from '@app/contracts/tiktok-fetcher/tiktok-fetcher.patterns';

@Controller('tiktok')
export class TiktokController {
    constructor(private readonly tiktokService: TiktokService) {}

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.GET_ORDER_SEARCH)
    async getOrderSearch(params: { shop_id: string }) {
        const getOrderSearchParams = {
            appKey: '69842a899nvel',
            shopCipher: 'ROW_MO-qpAAAAADZmK4LJiK7Qvk73nuoNyvo',
            accessToken:
                'ROW_63xvpAAAAAAbxSlOaMckKupA_jtmiH8Bu1e1BwOen2iSAZq45HZPSygr528cgnum8TUn_WGyh8ASHzh1wICPW7hqV6vbqA2tN7rUxOfO2oeaJDIL67MqiYnajK9xWSo4dXwmMxsBY9RLf2ktk_UuGHW_kT_MdO0NcoZfMQB0DUUWPFlLk-88Xw',
            pageSize: 50,
            sortOrder: 'DESC',
        };
        return await this.tiktokService.getOrderSearch(getOrderSearchParams);
    }

    @MessagePattern(TIKTOK_FETCHER_PATTERNS.GET_ORDER_DETAILS)
    async getOrderDetails(params: { shop_id: string; order_id: string }) {
        const getOrderDetailsParams = {
            ids: [params.order_id],
            accessToken:
                'ROW_63xvpAAAAAAbxSlOaMckKupA_jtmiH8Bu1e1BwOen2iSAZq45HZPSygr528cgnum8TUn_WGyh8ASHzh1wICPW7hqV6vbqA2tN7rUxOfO2oeaJDIL67MqiYnajK9xWSo4dXwmMxsBY9RLf2ktk_UuGHW_kT_MdO0NcoZfMQB0DUUWPFlLk-88Xw',
            shopCipher: 'ROW_MO-qpAAAAADZmK4LJiK7Qvk73nuoNyvo',
        };

        return await this.tiktokService.getOrderDetails(getOrderDetailsParams);
    }
}
