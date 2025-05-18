export interface ITikTokOrderResponse {
    code: number;
    data: {
        next_page_token: string;
        total_count: number;
        orders: {
            id: string;
            buyer_message: string;
            cancellation_initiator: string;
            shipping_provider_id: string;
            create_time: number;
            shipping_provider: string;
            packages: {
                id: string;
            }[];
            payment: {
                currency: string;
                sub_total: string;
                shipping_fee: string;
                seller_discount: string;
                platform_discount: string;
                total_amount: string;
                original_total_product_price: string;
                original_shipping_fee: string;
                shipping_fee_seller_discount: string;
                shipping_fee_platform_discount: string;
                shipping_fee_cofunded_discount: string;
                tax: string;
                small_order_fee: string;
                shipping_fee_tax: string;
                product_tax: string;
                retail_delivery_fee: string;
                buyer_service_fee: string;
                handling_fee: string;
                shipping_insurance_fee: string;
                item_insurance_fee: string;
            };
            recipient_address: {
                full_address: string;
                phone_number: string;
                name: string;
                first_name: string;
                last_name: string;
                first_name_local_script: string;
                last_name_local_script: string;
                address_detail: string;
                address_line1: string;
                address_line2: string;
                address_line3: string;
                address_line4: string;
                district_info: {
                    address_level_name: string;
                    address_name: string;
                    address_level: string;
                }[];
                delivery_preferences: {
                    drop_off_location: string;
                };
                postal_code: string;
                region_code: string;
            };
            status: string;
            fulfillment_type: string;
            delivery_type: string;
            paid_time: number;
            rts_sla_time: number;
            tts_sla_time: number;
            cancel_reason: string;
            update_time: number;
            payment_method_name: string;
            rts_time: number;
            tracking_number: string;
            split_or_combine_tag: string;
            has_updated_recipient_address: boolean;
            cancel_order_sla_time: number;
            warehouse_id: string;
            request_cancel_time: number;
            shipping_type: string;
            user_id: string;
            seller_note: string;
            delivery_sla_time: number;
            is_cod: boolean;
            delivery_option_id: string;
            cancel_time: number;
            need_upload_invoice: string;
            delivery_option_name: string;
            cpf: string;
            line_items: {
                id: string;
                sku_id: string;
                combined_listing_skus: {
                    sku_id: string;
                    sku_count: number;
                    product_id: string;
                    seller_sku: string;
                }[];
                display_status: string;
                product_name: string;
                seller_sku: string;
                sku_image: string;
                sku_name: string;
                product_id: string;
                sale_price: string;
                platform_discount: string;
                seller_discount: string;
                sku_type: string;
                cancel_reason: string;
                original_price: string;
                rts_time: number;
                package_status: string;
                currency: string;
                shipping_provider_name: string;
                cancel_user: string;
                shipping_provider_id: string;
                is_gift: boolean;
                item_tax: {
                    tax_type: string;
                    tax_amount: string;
                    tax_rate: string;
                }[];
                tracking_number: string;
                package_id: string;
                retail_delivery_fee: string;
                buyer_service_fee: string;
                small_order_fee: string;
                handling_duration_days: string;
                is_dangerous_good: boolean;
                needs_prescription: boolean;
            }[];
            buyer_email: string;
            delivery_due_time: number;
            is_sample_order: string;
            shipping_due_time: number;
            collection_due_time: number;
            delivery_option_required_delivery_time: number;
            is_on_hold_order: boolean;
            delivery_time: number;
            is_replacement_order: boolean;
            collection_time: number;
            replaced_order_id: string;
            is_buyer_request_cancel: boolean;
            pick_up_cut_off_time: number;
            fast_dispatch_sla_time: number;
            commerce_platform: string;
            order_type: string;
            release_date: number;
            handling_duration: {
                days: string;
                type: string;
            };
            auto_combine_group_id: string;
            cpf_name: string;
            is_exchange_order: boolean;
            exchange_source_order_id: string;
            consultation_id: string;
            fast_delivery_program: string;
        }[];
    };
    message: string;
    request_id: string;
}
export interface IGenerateSignatureParams {
    uri: string;
    qs?: Record<string, any>;
    headers?: Record<string, string>;
    body?: Record<string, any>;
}
export interface IGetOrderSearchParams {
    appKey: string;
    shopCipher: string;
    accessToken: string;
    pageSize: number;
    sortOrder: string;
    pageToken?: string;
    sortField?: string;
    body?: Record<string, any>;
}

export interface IGetOrderDetailsParams {
    ids: string[];
    accessToken: string;
    shopCipher: string;
}

export interface IGetOrderSearchResponse {
    code: number;
    data: {
        next_page_token: string;
        orders: IOrder[];
        total_count: number;
    };
    message: string;
    request_id: string;
}

export interface IGetOrderDetailsResponse {
    code: number;
    data: {
        next_page_token: string;
        orders: IOrder[];
        total_count: number;
    };
    message: string;
    request_id: string;
}
export interface IOrder {
    buyer_email: string;
    buyer_message: string;
    cancel_order_sla_time: number;
    collection_due_time: number;
    commerce_platform: string;
    create_time: number;
    delivery_option_id: string;
    delivery_option_name: string;
    delivery_type: string;
    fulfillment_type: string;
    has_updated_recipient_address: boolean;
    id: string;
    is_cod: boolean;
    is_on_hold_order: boolean;
    is_replacement_order: boolean;
    is_sample_order: boolean;
    line_items: {
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
    }[];
    packages: {
        id: string;
    }[];
    payment: {
        currency: string;
        original_shipping_fee: string;
        original_total_product_price: string;
        platform_discount: string;
        seller_discount: string;
        shipping_fee: string;
        shipping_fee_cofunded_discount?: string;
        shipping_fee_platform_discount?: string;
        shipping_fee_seller_discount?: string;
        sub_total: string;
        tax: string;
        total_amount: string;
        handling_fee?: string;
        product_tax?: string;
        shipping_fee_tax?: string;
    };
    payment_method_name: string;
    recipient_address: {
        address_detail: string;
        address_line1: string;
        address_line2: string;
        address_line3: string;
        address_line4: string;
        district_info: {
            address_level: string;
            address_level_name: string;
            address_name: string;
        }[];
        first_name: string;
        first_name_local_script: string;
        full_address: string;
        last_name: string;
        last_name_local_script: string;
        name: string;
        phone_number: string;
        postal_code: string;
        region_code: string;
    };
    rts_sla_time: number;
    rts_time: number;
    shipping_due_time: number;
    shipping_provider: string;
    shipping_provider_id: string;
    shipping_type: string;
    status: string;
    tracking_number: string;
    tts_sla_time: number;
    update_time: number;
    user_id: string;
    warehouse_id: string;
}
