export interface RawOrderDetailsDto {
    shop: {
        tiktok_shop_code: string;
        // ...other shop fields
    };
    orders: Array<{
        id: string;
        commerce_platform: string;
        recipient_address: {
            address_detail: string;
            address_line1: string;
            address_line2: string;
            address_line3: string;
            address_line4: string;
            postal_code: string;
            region_code: string;
            phone_number: string;
            name: string;
            district_info?: Array<{
                address_level: string;
                address_level_name: string;
                address_name: string;
            }>;
            first_name?: string;
            first_name_local_script?: string;
            full_address?: string;
            last_name?: string;
            last_name_local_script?: string;
        };
        payment: {
            shipping_fee: string;
            sub_total: string;
            total_amount: string;
        };
        payment_method_name: string;
        create_time: number;
        update_time: number;
        line_items: Array<{
            currency: string;
            display_status: string;
            id: string;
            is_gift: boolean;
            original_price: string;
            package_id: string;
            package_status: string;
            platform_discount: string;
            product_id: string;
            product_name: string;
            rts_time: number;
            sale_price: string;
            seller_discount: string;
            seller_sku: string;
            shipping_provider_id: string;
            shipping_provider_name: string;
            sku_id: string;
            sku_image: string;
            sku_name: string;
            sku_type: string;
            tracking_number: string;
        }>;
        rts_sla_time: number;
        rts_time: number;
        shipping_due_time: number;
        shipping_provider: string;
        shipping_provider_id: string;
        shipping_type: string;
        status: string;
        tracking_number: string;
        tts_sla_time: number;
        user_id: string;
        warehouse_id: string;
        // ...other order fields
    }>;
}
