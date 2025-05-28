import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

@Schema({ versionKey: '__v' })
export class Counter {
    @Prop({ required: true }) _id: string;
    @Prop({ default: false }) deleted: boolean;
    @Prop({ type: Date, default: null }) deleted_at: Date | null;
    @Prop({ type: String, default: null }) deleted_by: string | null;
    @Prop({ default: 0 }) schema_version: number;
    @Prop({ default: 0 }) sequence_number: number;
    @Prop({ default: 0 }) write_version: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
