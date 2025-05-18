import { Injectable } from '@nestjs/common';
import {
    IOrderDetailsRaw,
    ITransformedOrderDetails,
} from './transformer.interface';

@Injectable()
export class TransformerService {
    transformRawOrderDetails(
        raw: IOrderDetailsRaw[]
    ): ITransformedOrderDetails[] {
        return raw.map(order => ({
            account: '', // Map as needed
            platform: order.commerce_platform,
            shop_id: order.user_id,
            platform_order_id: order.id,
            api_version: '', // Set as needed
            buyer_id: 0, // Map if available
            billing_address: {
                address1: order.recipient_address.address_line1,
                address2: order.recipient_address.address_line2,
                address3: order.recipient_address.address_line3,
                address4: order.recipient_address.address_line4,
                city: '', // Map if available
                postal_code: order.recipient_address.postal_code,
                country: order.recipient_address.region_code,
                first_name: order.recipient_address.first_name,
                phone1: order.recipient_address.phone_number,
            },
            buyer_coin: 0, // Map if available
            buyer_paid_shipping_fee: Number(order.payment.shipping_fee),
            created_at: '', // Convert order.create_time if needed
            created_at_timestamp: order.create_time,
            credit_card_promotion: 0, // Map if available
            deleted: 0, // Map if available
            deleted_at: '', // Map if available
            deleted_by: '', // Map if available
            is_shop_active: true, // Map if available
            items_count: order.line_items.length,
            net_buyer_price: Number(order.payment.sub_total),
            order_number: order.id,
            payment_method: order.payment_method_name,
            platform_buyer_username: '', // Map if available
            platform_created_at: '', // Convert order.create_time if needed
            platform_created_at_timestamp: order.create_time,
            platform_updated_at: '', // Convert order.update_time if needed
            platform_updated_at_timetamp: order.update_time,
            price: Number(order.payment.total_amount),
            promised_shipping_times: '', // Map if available
            shipping_address: {
                address1: order.recipient_address.address_line1,
                address2: order.recipient_address.address_line2,
                address3: order.recipient_address.address_line3,
                address4: order.recipient_address.address_line4,
                city: '', // Map if available
                postal_code: order.recipient_address.postal_code,
                country: order.recipient_address.region_code,
                first_name: order.recipient_address.first_name,
                phone1: order.recipient_address.phone_number,
            },
            shipping_fee: Number(order.payment.shipping_fee),
            shipping_fee_discount_platform: Number(
                order.payment.shipping_fee_platform_discount ?? 0
            ),
            shipping_fee_discount_seller: Number(
                order.payment.shipping_fee_seller_discount ?? 0
            ),
            statuses: {
                items: [], // Map as needed
            },
            updated_at_timestamp: order.update_time,
            voucher: 0, // Map if available
            voucher_platform: 0, // Map if available
            voucher_seller: 0, // Map if available
        }));
    }
}
