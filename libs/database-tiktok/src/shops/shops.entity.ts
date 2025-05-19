import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'shops' })
export class Shops {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    tiktok_shop_code: string;

    @Column()
    tiktok_shop_id: string;

    @Column()
    tiktok_shop_cipher: string;

    @Column()
    access_token: string;

    @Column()
    refresh_token: string;

    @Column()
    created_at: string;

    @Column()
    updated_at: string;
}
