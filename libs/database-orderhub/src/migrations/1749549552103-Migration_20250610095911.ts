import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration202506100959111749549552103 implements MigrationInterface {
    name = 'Migration202506100959111749549552103'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "invoice_content" jsonb`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "billing_address" jsonb`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "shipping_address" jsonb`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "line_items" jsonb`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "account_details" jsonb`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "tax_details" jsonb`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "order_number" character varying`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "payment_method" character varying`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "invoice_printed_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "currency" character varying NOT NULL DEFAULT 'PHP'`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "vat_exempt_sales" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "vat_zero_rated_sales" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "total_net_amount" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "gross_amount" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "invoice_status" character varying NOT NULL DEFAULT 'generated'`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "processing_notes" text`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "customer_name" character varying`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "customer_tin" character varying`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "customer_address" text`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "invoice_date" date`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "due_date" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "due_date"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "invoice_date"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "customer_address"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "customer_tin"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "customer_name"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "processing_notes"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "invoice_status"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "gross_amount"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "total_net_amount"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "vat_zero_rated_sales"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "vat_exempt_sales"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "invoice_printed_date"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "payment_method"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "order_number"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "tax_details"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "account_details"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "line_items"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "shipping_address"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "billing_address"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "invoice_content"`);
    }

}
