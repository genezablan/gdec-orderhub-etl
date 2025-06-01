import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration202506011051301748775091364 implements MigrationInterface {
    name = 'Migration202506011051301748775091364'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sales_invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sequence_number" character varying NOT NULL, "order_id" character varying NOT NULL, "shop_id" character varying NOT NULL, "package_id" character varying NOT NULL, "file_path" character varying NOT NULL, "amount_due" numeric(10,2), "vatable_sales" numeric(10,2), "vat_amount" numeric(10,2), "subtotal_net" numeric(10,2), "total_discount" numeric(10,2), "page_number" integer NOT NULL DEFAULT '1', "total_pages" integer NOT NULL DEFAULT '1', "generated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_be0576afbf66c353a8a4435a45b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f250cc9b6c3718b620c5c36c95" ON "sales_invoices" ("order_id", "shop_id", "package_id") `);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD CONSTRAINT "FK_29971bad71a71e63396c6e0b197" FOREIGN KEY ("shop_id", "order_id") REFERENCES "tiktok_orders"("shop_id","order_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP CONSTRAINT "FK_29971bad71a71e63396c6e0b197"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f250cc9b6c3718b620c5c36c95"`);
        await queryRunner.query(`DROP TABLE "sales_invoices"`);
    }

}
