import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration202505290450161748494217657 implements MigrationInterface {
    name = 'Migration202505290450161748494217657'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tiktok_orders" ADD "tin" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tiktok_orders" DROP COLUMN "tin"`);
    }

}
