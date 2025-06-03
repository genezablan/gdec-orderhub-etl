import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration202506030608351748930915535 implements MigrationInterface {
    name = 'Migration202506030608351748930915535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tiktok_order_items" ADD "quantity" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tiktok_order_items" DROP COLUMN "quantity"`);
    }

}
