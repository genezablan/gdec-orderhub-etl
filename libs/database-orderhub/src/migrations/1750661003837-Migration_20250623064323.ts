import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration202506230643231750661003837 implements MigrationInterface {
    name = 'Migration202506230643231750661003837'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "is_unmasked" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "unmasked_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" ADD "unmasking_status" character varying NOT NULL DEFAULT 'masked'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "unmasking_status"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "unmasked_at"`);
        await queryRunner.query(`ALTER TABLE "sales_invoices" DROP COLUMN "is_unmasked"`);
    }

}
