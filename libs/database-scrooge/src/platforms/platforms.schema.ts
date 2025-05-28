import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PlatformDocument = HydratedDocument<Platform>;

@Schema({ versionKey: '__v' })
export class Platform {
    @Prop() active: boolean;
    @Prop() ready_for_sync: boolean;
    @Prop() deleted: boolean;
    @Prop({ type: Date, default: null }) deleted_at: Date | null;
    @Prop({ type: String, default: null }) deleted_by: string | null;
    @Prop() name: string;
    @Prop() shop_name: string;
    @Prop() shop_url: string;
    @Prop() unique_platform_id: string;
    @Prop({
        type: [
            {
                _id: { type: Types.ObjectId },
                key: String,
                value: String,
            },
        ],
        default: [],
    })
    credentials: Array<{ _id: Types.ObjectId; key: string; value: string }>;
    @Prop({ type: Types.ObjectId }) account: Types.ObjectId;
    @Prop() last_synced_on: Date;
    @Prop() created_at: Date;
    @Prop() updated_at: Date;
    @Prop() last_synced_for_transactions: Date;
    @Prop() ready_for_transaction_sync: boolean;
    @Prop({
        type: [
            {
                country: String,
                user_id: String,
                seller_id: String,
                short_code: String,
            },
        ],
        default: [],
    })
    country_user_info: Array<{
        country: string;
        user_id: string;
        seller_id: string;
        short_code: string;
    }>;
    @Prop({
        type: [
            {
                start_date: Date,
                end_date: Date,
            },
        ],
        default: [],
    })
    active_dates: Array<{ start_date: Date; end_date?: Date }>;
    @Prop() last_synced_for_items: Date;
    @Prop() ready_for_items_sync: boolean;
    @Prop() schema_version: number;
    @Prop() business_model: any;
    @Prop() tag: number;
}

export const PlatformSchema = SchemaFactory.createForClass(Platform);
