import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { TiktokOrder } from '../tiktok_order/tiktok_order.entity';

@Entity('sales_invoices')
@Index(['orderId', 'shopId', 'packageId'], { unique: true })
export class SalesInvoice {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'sequence_number', type: 'varchar' })
    sequenceNumber: string;

    @Column({ name: 'order_id', type: 'varchar' })
    orderId: string;

    @Column({ name: 'shop_id', type: 'varchar' })
    shopId: string;

    @Column({ name: 'package_id', type: 'varchar' })
    packageId: string;

    @Column({ name: 'file_path', type: 'varchar' })
    filePath: string;

    @Column({ name: 'amount_due', type: 'decimal', precision: 10, scale: 2, nullable: true })
    amountDue: string;

    @Column({ name: 'vatable_sales', type: 'decimal', precision: 10, scale: 2, nullable: true })
    vatableSales: string;

    @Column({ name: 'vat_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    vatAmount: string;

    @Column({ name: 'subtotal_net', type: 'decimal', precision: 10, scale: 2, nullable: true })
    subtotalNet: string;

    @Column({ name: 'total_discount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    totalDiscount: string;

    @Column({ name: 'page_number', type: 'integer', default: 1 })
    pageNumber: number;

    @Column({ name: 'total_pages', type: 'integer', default: 1 })
    totalPages: number;

    @Column({ name: 'generated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    generatedAt: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    // Relation to TiktokOrder
    @ManyToOne(() => TiktokOrder, {
        onDelete: 'CASCADE',
    })
    @JoinColumn([
        { name: 'shop_id', referencedColumnName: 'shopId' },
        { name: 'order_id', referencedColumnName: 'orderId' },
    ])
    order: TiktokOrder;
}
