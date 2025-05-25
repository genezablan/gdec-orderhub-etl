import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './counters.schema';

@Injectable()
export class CountersService {
    constructor(
        @InjectModel(Counter.name) private counterModel: Model<CounterDocument>
    ) {}

    async findById(id: string): Promise<Counter | null> {
        return this.counterModel.findById(id).exec();
    }

    async incrementSequence(id: string): Promise<Counter> {
        return this.counterModel
            .findByIdAndUpdate(
                id,
                { $inc: { sequence_number: 1 } },
                { new: true, upsert: true }
            )
            .exec();
    }

    async resetSequence(id: string, value = 0): Promise<Counter> {
        return this.counterModel
            .findByIdAndUpdate(
                id,
                { $set: { sequence_number: value } },
                { new: true, upsert: true }
            )
            .exec();
    }

    async findAll(): Promise<Counter[]> {
        return this.counterModel.find().exec();
    }

    /**
     * Atomically increments the sequence_number for the given _id.
     * Ensures uniqueness even with concurrent/multiple app calls.
     */
    async incrementB2BSalesInvoiceNumber(): Promise<number> {
        const updated = await this.counterModel
            .findOneAndUpdate(
                { _id: 'b2b_sales_invoice_number' },
                { $inc: { sequence_number: 1 } },
                { new: true, upsert: true }
            )
            .exec();
        return updated.sequence_number;
    }
}
