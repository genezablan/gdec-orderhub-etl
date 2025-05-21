export * from '../../../../../libs/contracts/src/tiktok-transformer/dto/receipt.dto';
export interface TransformedOrderDetailsDto {
    account: string;
    platform: string;
    shop_id: string;
    platform_order_id: string;
    api_version: string;
    buyer_id: number;
    billing_address: {
        address1: string;
        address2: string;
        address3: string;
        address4: string;
        city: string;
        postal_code: string;
        country: string;
        first_name: string;
        phone1: string;
    };
    buyer_coin: number;
    buyer_paid_shipping_fee: number;
    created_at: string;
    created_at_timestamp: number;
    credit_card_promotion: number;
    deleted: number;
    deleted_at: string;
    deleted_by: string;
    is_shop_active: boolean;
    items_count: number;
    net_buyer_price: number;
    order_number: string;
    payment_method: string;
    platform_buyer_username: string;
    platform_created_at: string;
    platform_created_at_timestamp: number;
    platform_updated_at: string;
    platform_updated_at_timetamp: number;
    price: number;
    promised_shipping_times: string;
    // ...other fields
}
