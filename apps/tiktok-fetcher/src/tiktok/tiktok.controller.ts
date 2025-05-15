import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TiktokService } from './tiktok.service';

@Controller('tiktok')
export class TiktokController {
    constructor(private readonly tiktokService: TiktokService) {}

    @MessagePattern('tiktok.fetchOrders')
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

    @MessagePattern('tiktok.fetchOrderDetails')
    async fetchOrderDetails() {
        console.log('tiktok.fetchOrderDetails');
        const getOrderDetailsParams = {
            ids: ['578844277904147481'],
            accessToken:
                'ROW_63xvpAAAAAAbxSlOaMckKupA_jtmiH8Bu1e1BwOen2iSAZq45HZPSygr528cgnum8TUn_WGyh8ASHzh1wICPW7hqV6vbqA2tN7rUxOfO2oeaJDIL67MqiYnajK9xWSo4dXwmMxsBY9RLf2ktk_UuGHW_kT_MdO0NcoZfMQB0DUUWPFlLk-88Xw',
            shopCipher: 'ROW_MO-qpAAAAADZmK4LJiK7Qvk73nuoNyvo',
        };

        return await this.tiktokService.getOrderDetails(getOrderDetailsParams);
    }
}
