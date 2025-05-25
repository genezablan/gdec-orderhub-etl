import { Injectable } from '@nestjs/common';
import { RawOrderDetailsDto } from '@app/contracts/tiktok-fetcher/dto/raw-order-details.dto';
import { TiktokOrderDto } from '@app/contracts/database-orderhub/tiktok_order.dto';
import { TiktokOrderItemDto } from '@app/contracts/database-orderhub/tiktok_order_item.dto';
import { TransformedOrderDetailsDto } from '@app/contracts/tiktok-transformer/dto/order-details.dto';

@Injectable()
export class OrderDetailsService {
    /**
     * Transforms RawOrderDetailsDto to arrays of TiktokOrderDto and TiktokOrderItemDto
     */
    transformRawOrderDetails(
        raw: RawOrderDetailsDto
    ): TransformedOrderDetailsDto {
        const orders: TiktokOrderDto[] = [];
        const shop = raw.shop;
        const shopId = shop.tiktok_shop_code;
        raw.orders.forEach(order => {
            const items: TiktokOrderItemDto[] = [];
            const orderDto = new TiktokOrderDto();
            orderDto.id = order.id;
            orderDto.orderId = order.id;
            orderDto.shopId = shopId;
            orderDto.commercePlatform = order.commerce_platform;
            orderDto.createTime = order.create_time;
            orderDto.updateTime = order.update_time;
            orderDto.paymentMethodName = order.payment_method_name;
            orderDto.totalAmount = order.payment?.total_amount;
            orderDto.shippingFee = order.payment?.shipping_fee;
            orderDto.subTotal = order.payment?.sub_total;
            // Address fields
            if (order.recipient_address) {
                orderDto.addressDetail = order.recipient_address.address_detail;
                // Find country, region, province, municipality, barangay from district_info
                const districtInfo = order.recipient_address.district_info;
                if (Array.isArray(districtInfo)) {
                    const countryDistrict = districtInfo.find(
                        d => d.address_level_name.toLowerCase() === 'country'
                    );
                    orderDto.country = countryDistrict?.address_name;
                    const regionDistrict = districtInfo.find(
                        d => d.address_level_name.toLowerCase() === 'region'
                    );
                    orderDto.region = regionDistrict?.address_name;
                    const provinceDistrict = districtInfo.find(
                        d => d.address_level_name.toLowerCase() === 'province'
                    );
                    orderDto.province = provinceDistrict?.address_name;
                    const municipalityDistrict = districtInfo.find(
                        d =>
                            d.address_level_name.toLowerCase() ===
                            'municipality'
                    );
                    orderDto.municipality = municipalityDistrict?.address_name;
                    const barangayDistrict = districtInfo.find(
                        d => d.address_level_name.toLowerCase() === 'barangay'
                    );
                    orderDto.barangay = barangayDistrict?.address_name;
                }
                orderDto.firstName = order.recipient_address.first_name;
                orderDto.firstNameLocalScript =
                    order.recipient_address.first_name_local_script;
                orderDto.name = order.recipient_address.name;
                orderDto.phoneNumber = order.recipient_address.phone_number;
                orderDto.postalCode = order.recipient_address.postal_code;
                orderDto.regionCode = order.recipient_address.region_code;
            }
            orderDto.rtsSlaTime = order.rts_sla_time;
            orderDto.rtsTime = order.rts_time;
            orderDto.shippingDueTime = order.shipping_due_time;
            orderDto.shippingProvider = order.shipping_provider;
            orderDto.shippingProviderId = order.shipping_provider_id;
            orderDto.shippingType = order.shipping_type;
            orderDto.status = order.status;
            orderDto.trackingNumber = order.tracking_number;
            orderDto.ttsSlaTime = order.tts_sla_time;
            orderDto.updateTime = order.update_time;
            orderDto.userId = order.user_id;
            orderDto.warehouseId = order.warehouse_id;

            // Map line items
            order.line_items.forEach(item => {
                const itemDto = new TiktokOrderItemDto();
                itemDto.id = item.id;
                itemDto.orderId = order.id;
                itemDto.shopId = shopId;
                itemDto.productId = item.product_id;
                itemDto.productName = item.product_name;
                itemDto.skuId = item.sku_id;
                itemDto.skuName = item.sku_name;
                itemDto.skuImage = item.sku_image;
                itemDto.salePrice = item.sale_price;
                itemDto.platformDiscount = item.platform_discount;
                itemDto.sellerDiscount = item.seller_discount;
                itemDto.originalPrice = item.original_price;
                itemDto.shippingProviderId = item.shipping_provider_id;
                itemDto.shippingProviderName = item.shipping_provider_name;
                itemDto.trackingNumber = item.tracking_number;
                // Only map fields that exist in raw data
                items.push(itemDto);
            });

            orderDto.items = items;
            orders.push(orderDto);
        });

        return {
            orders,
        };
    }
}
