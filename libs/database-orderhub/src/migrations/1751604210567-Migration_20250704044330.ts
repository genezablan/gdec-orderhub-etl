import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration202507040443301751604210567 implements MigrationInterface {
    name = 'Migration202507040443301751604210567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user', 'pending')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "first_name" character varying, "last_name" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'pending', "status" "public"."users_status_enum" NOT NULL DEFAULT 'inactive', "cognito_user_id" character varying, "department" character varying, "job_title" character varying, "notes" text, "last_login_at" TIMESTAMP, "approved_by" character varying, "approved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."access_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "access_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "status" "public"."access_requests_status_enum" NOT NULL DEFAULT 'pending', "admin_notes" text, "requested_role" character varying, "processed_by" character varying, "processed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "processed_by_user_id" uuid, CONSTRAINT "UQ_af42518431964ee61a31761bd46" UNIQUE ("email"), CONSTRAINT "PK_f89e51c15e3dbea13aa248fe128" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_af42518431964ee61a31761bd4" ON "access_requests" ("email") `);
        await queryRunner.query(`ALTER TABLE "access_requests" ADD CONSTRAINT "FK_a65c5d8f1dc67afc97fadaef95c" FOREIGN KEY ("processed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "access_requests" DROP CONSTRAINT "FK_a65c5d8f1dc67afc97fadaef95c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_af42518431964ee61a31761bd4"`);
        await queryRunner.query(`DROP TABLE "access_requests"`);
        await queryRunner.query(`DROP TYPE "public"."access_requests_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
