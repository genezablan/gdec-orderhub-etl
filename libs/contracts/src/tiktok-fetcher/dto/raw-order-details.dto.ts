export interface RawOrderDetailsDto {
    shop: {
        tiktok_shop_code: string;
        // ...other shop fields
    };
    orders: Array<{
        id: string;
        commerce_platform: string;
        user_id: string;
        recipient_address: {
            address_line1: string;
            address_line2: string;
            address_line3: string;
            address_line4: string;
            postal_code: string;
            region_code: string;
            first_name: string;
            phone_number: string;
        };
        payment: {
            shipping_fee: string;
            sub_total: string;
            total_amount: string;
        };
        payment_method_name: string;
        create_time: number;
        update_time: number;
        line_items: Array<any>;
        // ...other order fields
    }>;
}
