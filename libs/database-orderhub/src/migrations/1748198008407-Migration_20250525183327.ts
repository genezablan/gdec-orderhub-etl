import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration202505251833271748198008407 implements MigrationInterface {
    name = 'Migration202505251833271748198008407'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tiktok_order_items" RENAME COLUMN "uuid" TO "id"`);
        await queryRunner.query(`ALTER TABLE "tiktok_order_items" RENAME CONSTRAINT "PK_618bf7b4b2ff48be554045c86c3" TO "PK_92b4ab913ece0d503b19e8438f5"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tiktok_order_items" RENAME CONSTRAINT "PK_92b4ab913ece0d503b19e8438f5" TO "PK_618bf7b4b2ff48be554045c86c3"`);
        await queryRunner.query(`ALTER TABLE "tiktok_order_items" RENAME COLUMN "id" TO "uuid"`);
    }

}
