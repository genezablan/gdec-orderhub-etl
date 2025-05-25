import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Platform } from './platforms.schema';

@Injectable()
export class PlatformService {
    constructor(
        @InjectModel(Platform.name) private platformModel: Model<Platform>
    ) {}

    async findAll(): Promise<Platform[]> {
        return this.platformModel.find().exec();
    }
}
