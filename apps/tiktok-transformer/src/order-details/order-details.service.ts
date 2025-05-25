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
            orderDto.buyerEmail = order.buyer_email;
            orderDto.buyerMessage = order.buyer_message;
            orderDto.cancelOrderSlaTime = order.cancel_order_sla_time;
            orderDto.collectionDueTime = order.collection_due_time;
            orderDto.collectionTime = order.collection_time;
            orderDto.commercePlatform = order.commerce_platform;
            orderDto.createTime = order.create_time;
            orderDto.deliveryOptionId = order.delivery_option_id;
            orderDto.deliveryOptionName = order.delivery_option_name;
            orderDto.deliveryTime = order.delivery_time;
            orderDto.deliveryType = order.delivery_type;
            orderDto.fulfillmentType = order.fulfillment_type;
            orderDto.hasUpdatedRecipientAddress =
                order.has_updated_recipient_address;
            orderDto.orderId = order.id;
            orderDto.isCod = order.is_cod;
            orderDto.isOnHoldOrder = order.is_on_hold_order;
            orderDto.isReplacementOrder = order.is_replacement_order;
            orderDto.isSampleOrder = order.is_sample_order;
            orderDto.paidTime = order.paid_time;
            orderDto.shopId = shopId;
            orderDto.paymentMethodName = order.payment_method_name;
            // Payment fields
            if (order.payment) {
                orderDto.currency = order.payment.currency;
                orderDto.originalShippingFee =
                    order.payment.original_shipping_fee;
                orderDto.originalTotalProductPrice =
                    order.payment.original_total_product_price;
                orderDto.platformDiscount = order.payment.platform_discount;
                orderDto.sellerDiscount = order.payment.seller_discount;
                orderDto.shippingFee = order.payment.shipping_fee;
                orderDto.shippingFeeCofundedDiscount =
                    order.payment.shipping_fee_cofunded_discount;
                orderDto.shippingFeePlatformDiscount =
                    order.payment.shipping_fee_platform_discount;
                orderDto.shippingFeeSellerDiscount =
                    order.payment.shipping_fee_seller_discount;
                orderDto.subTotal = order.payment.sub_total;
                orderDto.tax = order.payment.tax;
                orderDto.totalAmount = order.payment.total_amount;
            }
            // Address fields
            if (order.recipient_address) {
                orderDto.addressDetail = order.recipient_address.address_detail;
                orderDto.addressLine1 = order.recipient_address.address_line1;
                if ('addressLine2' in orderDto)
                    orderDto.addressLine2 =
                        order.recipient_address.address_line2;
                if ('addressLine3' in orderDto)
                    orderDto.addressLine3 =
                        order.recipient_address.address_line3;
                if ('addressLine4' in orderDto)
                    orderDto.addressLine4 =
                        order.recipient_address.address_line4;
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
                orderDto.fullAddress = order.recipient_address.full_address;
                orderDto.lastName = order.recipient_address.last_name;
                orderDto.lastNameLocalScript =
                    order.recipient_address.last_name_local_script;
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
                itemDto.lineItemId = item.id;
                itemDto.orderId = order.id;
                itemDto.shopId = shopId;
                itemDto.productId = item.product_id;
                itemDto.productName = item.product_name;
                itemDto.skuId = item.sku_id;
                itemDto.skuName = item.sku_name;
                itemDto.skuImage = item.sku_image;
                itemDto.originalPrice = item.original_price;
                itemDto.salePrice = item.sale_price;
                itemDto.platformDiscount = item.platform_discount;
                itemDto.sellerDiscount = item.seller_discount;
                itemDto.shippingProviderId = item.shipping_provider_id;
                itemDto.shippingProviderName = item.shipping_provider_name;
                itemDto.trackingNumber = item.tracking_number;
                // Newly added fields
                itemDto.currency = item.currency;
                itemDto.displayStatus = item.display_status;
                itemDto.isGift = item.is_gift;
                itemDto.packageId = item.package_id;
                itemDto.packageStatus = item.package_status;
                itemDto.rtsTime = item.rts_time;
                itemDto.sellerSku = item.seller_sku;
                itemDto.skuType = item.sku_type;
                items.push(itemDto);
            });
            orderDto.items = items;
            orderDto.packagesId = order.packages
                .map(pkg => (pkg.id ? pkg.id : ''))
                .join(', ');
            orders.push(orderDto);
        });

        return {
            orders,
        };
    }
}
