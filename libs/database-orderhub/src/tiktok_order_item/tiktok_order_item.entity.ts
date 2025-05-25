import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { TiktokOrder } from '../tiktok_order/tiktok_order.entity'; // adjust path if needed

@Entity('tiktok_order_items')
@Index(['shopId', 'orderId', 'lineItemId'], { unique: true })
export class TiktokOrderItem {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'shop_id', type: 'varchar' })
    shopId: string;

    @Column({ name: 'order_id', type: 'varchar' })
    orderId: string;

    @Column({ name: 'line_item_id', type: 'varchar' })
    lineItemId: string;

    @ManyToOne(() => TiktokOrder, order => order.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn([
        { name: 'shop_id', referencedColumnName: 'shopId' },
        { name: 'order_id', referencedColumnName: 'orderId' },
    ])
    order: TiktokOrder;

    @Column({ name: 'currency', type: 'varchar', nullable: true })
    currency: string;

    @Column({ name: 'display_status', type: 'varchar', nullable: true })
    displayStatus: string;

    @Column({ name: 'is_gift', type: 'boolean', default: false })
    isGift: boolean;

    @Column({
        name: 'original_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    originalPrice: string;

    @Column({ name: 'package_id', type: 'varchar', nullable: true })
    packageId: string;

    @Column({ name: 'package_status', type: 'varchar', nullable: true })
    packageStatus: string;

    @Column({
        name: 'platform_discount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    platformDiscount: string;

    @Column({ name: 'product_id', type: 'varchar', nullable: true })
    productId: string;

    @Column({ name: 'product_name', type: 'varchar', nullable: true })
    productName: string;

    @Column({ name: 'rts_time', type: 'bigint', nullable: true })
    rtsTime: number;

    @Column({
        name: 'sale_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    salePrice: string;

    @Column({
        name: 'seller_discount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    sellerDiscount: string;

    @Column({ name: 'seller_sku', type: 'varchar', nullable: true })
    sellerSku: string;

    @Column({ name: 'shipping_provider_id', type: 'varchar', nullable: true })
    shippingProviderId: string;

    @Column({ name: 'shipping_provider_name', type: 'varchar', nullable: true })
    shippingProviderName: string;

    @Column({ name: 'sku_id', type: 'varchar', nullable: true })
    skuId: string;

    @Column({ name: 'sku_image', type: 'text', nullable: true })
    skuImage: string;

    @Column({ name: 'sku_name', type: 'varchar', nullable: true })
    skuName: string;

    @Column({ name: 'sku_type', type: 'varchar', nullable: true })
    skuType: string;

    @Column({ name: 'tracking_number', type: 'varchar', nullable: true })
    trackingNumber: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}
