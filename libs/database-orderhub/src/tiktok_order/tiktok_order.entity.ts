import {
    Entity,
    Column,
    PrimaryColumn,
    Index,
    PrimaryGeneratedColumn,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TiktokOrderItem } from '../tiktok_order_item/tiktok_order_item.entity'; // adjust path if needed

@Entity('tiktok_orders')
@Index(['shopId', 'orderId'], { unique: true })
export class TiktokOrder {
    @OneToMany(() => TiktokOrderItem, item => item.order)
    items: TiktokOrderItem[];

    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @PrimaryColumn({ name: 'order_id', type: 'varchar' })
    orderId: string;

    @PrimaryColumn({ name: 'shop_id', type: 'varchar' })
    shopId: string;

    @Column({ name: 'buyer_email', type: 'varchar', nullable: true })
    buyerEmail: string;

    @Column({ name: 'buyer_message', type: 'text', nullable: true })
    buyerMessage: string;

    @Column({ name: 'cancel_order_sla_time', type: 'bigint', nullable: true })
    cancelOrderSlaTime: number;

    @Column({ name: 'collection_due_time', type: 'bigint', nullable: true })
    collectionDueTime: number;

    @Column({ name: 'collection_time', type: 'bigint', nullable: true })
    collectionTime: number;

    @Column({ name: 'commerce_platform', type: 'varchar', nullable: true })
    commercePlatform: string;

    @Column({ name: 'create_time', type: 'bigint', nullable: true })
    createTime: number;

    @Column({ name: 'delivery_option_id', type: 'varchar', nullable: true })
    deliveryOptionId: string;

    @Column({ name: 'delivery_option_name', type: 'varchar', nullable: true })
    deliveryOptionName: string;

    @Column({ name: 'delivery_time', type: 'bigint', nullable: true })
    deliveryTime: number;

    @Column({ name: 'delivery_type', type: 'varchar', nullable: true })
    deliveryType: string;

    @Column({ name: 'fulfillment_type', type: 'varchar', nullable: true })
    fulfillmentType: string;

    @Column({
        name: 'has_updated_recipient_address',
        type: 'boolean',
        default: false,
    })
    hasUpdatedRecipientAddress: boolean;

    @Column({ name: 'tiktok_id', type: 'varchar', nullable: true })
    tiktokId: string;

    @Column({ name: 'is_cod', type: 'boolean', default: false })
    isCod: boolean;

    @Column({ name: 'is_on_hold_order', type: 'boolean', default: false })
    isOnHoldOrder: boolean;

    @Column({ name: 'is_replacement_order', type: 'boolean', default: false })
    isReplacementOrder: boolean;

    @Column({ name: 'is_sample_order', type: 'boolean', default: false })
    isSampleOrder: boolean;

    // Payment
    @Column({ name: 'currency', type: 'varchar', nullable: true })
    currency: string;

    @Column({
        name: 'original_shipping_fee',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    originalShippingFee: string;

    @Column({
        name: 'original_total_product_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    originalTotalProductPrice: string;

    @Column({
        name: 'platform_discount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    platformDiscount: string;

    @Column({
        name: 'seller_discount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    sellerDiscount: string;

    @Column({
        name: 'shipping_fee',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    shippingFee: string;

    @Column({
        name: 'shipping_fee_cofunded_discount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    shippingFeeCofundedDiscount: string;

    @Column({
        name: 'shipping_fee_platform_discount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    shippingFeePlatformDiscount: string;

    @Column({
        name: 'shipping_fee_seller_discount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    shippingFeeSellerDiscount: string;

    @Column({
        name: 'sub_total',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    subTotal: string;

    @Column({
        name: 'tax',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    tax: string;

    @Column({
        name: 'total_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    totalAmount: string;

    @Column({ name: 'payment_method_name', type: 'varchar', nullable: true })
    paymentMethodName: string;

    // Address Info
    @Column({ name: 'address_detail', type: 'text', nullable: true })
    addressDetail: string;

    @Column({ name: 'country', type: 'varchar', nullable: true })
    country: string;

    @Column({ name: 'region', type: 'varchar', nullable: true })
    region: string;

    @Column({ name: 'province', type: 'varchar', nullable: true })
    province: string;

    @Column({ name: 'municipality', type: 'varchar', nullable: true })
    municipality: string;

    @Column({ name: 'barangay', type: 'varchar', nullable: true })
    barangay: string;

    @Column({ name: 'first_name', type: 'varchar', nullable: true })
    firstName: string;

    @Column({
        name: 'first_name_local_script',
        type: 'varchar',
        nullable: true,
    })
    firstNameLocalScript: string;

    @Column({ name: 'full_address', type: 'text', nullable: true })
    fullAddress: string;

    @Column({ name: 'last_name', type: 'varchar', nullable: true })
    lastName: string;

    @Column({ name: 'last_name_local_script', type: 'varchar', nullable: true })
    lastNameLocalScript: string;

    @Column({ name: 'name', type: 'varchar', nullable: true })
    name: string;

    @Column({ name: 'phone_number', type: 'varchar', nullable: true })
    phoneNumber: string;

    @Column({ name: 'postal_code', type: 'varchar', nullable: true })
    postalCode: string;

    @Column({ name: 'region_code', type: 'varchar', nullable: true })
    regionCode: string;

    // Shipping Info
    @Column({ name: 'rts_sla_time', type: 'bigint', nullable: true })
    rtsSlaTime: number;

    @Column({ name: 'rts_time', type: 'bigint', nullable: true })
    rtsTime: number;

    @Column({ name: 'shipping_due_time', type: 'bigint', nullable: true })
    shippingDueTime: number;

    @Column({ name: 'shipping_provider', type: 'varchar', nullable: true })
    shippingProvider: string;

    @Column({ name: 'shipping_provider_id', type: 'varchar', nullable: true })
    shippingProviderId: string;

    @Column({ name: 'shipping_type', type: 'varchar', nullable: true })
    shippingType: string;

    @Column({ name: 'status', type: 'varchar', nullable: true })
    status: string;

    @Column({ name: 'tracking_number', type: 'varchar', nullable: true })
    trackingNumber: string;

    @Column({ name: 'tts_sla_time', type: 'bigint', nullable: true })
    ttsSlaTime: number;

    @Column({ name: 'update_time', type: 'bigint', nullable: true })
    updateTime: number;

    @Column({ name: 'user_id', type: 'varchar', nullable: true })
    userId: string;

    @Column({ name: 'warehouse_id', type: 'varchar', nullable: true })
    warehouseId: string;

    @Column({ name: 'packages_id', type: 'varchar', nullable: true })
    packagesId: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}
