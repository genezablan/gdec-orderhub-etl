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

    // Enhanced invoice content storage
    @Column({ name: 'invoice_content', type: 'jsonb', nullable: true })
    invoiceContent: any; // Complete invoice data backup

    @Column({ name: 'billing_address', type: 'jsonb', nullable: true })
    billingAddress: any; // Customer billing address

    @Column({ name: 'shipping_address', type: 'jsonb', nullable: true })
    shippingAddress: any; // Customer shipping address

    @Column({ name: 'line_items', type: 'jsonb', nullable: true })
    lineItems: any; // Detailed line items with product info

    @Column({ name: 'account_details', type: 'jsonb', nullable: true })
    accountDetails: any; // Company/account information

    @Column({ name: 'tax_details', type: 'jsonb', nullable: true })
    taxDetails: any; // Detailed tax calculations

    // Additional invoice metadata
    @Column({ name: 'order_number', type: 'varchar', nullable: true })
    orderNumber: string;

    @Column({ name: 'payment_method', type: 'varchar', nullable: true })
    paymentMethod: string;

    @Column({ name: 'invoice_printed_date', type: 'timestamp', nullable: true })
    invoicePrintedDate: Date;

    @Column({ name: 'currency', type: 'varchar', default: 'PHP' })
    currency: string;

    // VAT breakdown (enhanced)
    @Column({ name: 'vat_exempt_sales', type: 'decimal', precision: 12, scale: 2, default: 0 })
    vatExemptSales: string;

    @Column({ name: 'vat_zero_rated_sales', type: 'decimal', precision: 12, scale: 2, default: 0 })
    vatZeroRatedSales: string;

    // Enhanced financial totals
    @Column({ name: 'total_net_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
    totalNetAmount: string;

    @Column({ name: 'gross_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
    grossAmount: string;

    // Invoice status and processing
    @Column({ name: 'invoice_status', type: 'varchar', default: 'generated' })
    invoiceStatus: string;

    @Column({ name: 'processing_notes', type: 'text', nullable: true })
    processingNotes: string;

    // Customer information
    @Column({ name: 'customer_name', type: 'varchar', nullable: true })
    customerName: string;

    @Column({ name: 'customer_tin', type: 'varchar', nullable: true })
    customerTin: string;

    @Column({ name: 'customer_address', type: 'text', nullable: true })
    customerAddress: string;

    // Enhanced timestamps
    @Column({ name: 'invoice_date', type: 'date', nullable: true })
    invoiceDate: Date;

    @Column({ name: 'due_date', type: 'date', nullable: true })
    dueDate: Date;

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
