import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration202506010345471748749547864 implements MigrationInterface {
    name = 'Migration202506010345471748749547864'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tiktok_orders" ADD "address_detail_unmasked" text`);
        await queryRunner.query(`ALTER TABLE "tiktok_orders" ADD "name_unmasked" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tiktok_orders" DROP COLUMN "name_unmasked"`);
        await queryRunner.query(`ALTER TABLE "tiktok_orders" DROP COLUMN "address_detail_unmasked"`);
    }

}
