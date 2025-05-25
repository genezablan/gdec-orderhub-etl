import { MongooseModuleOptions } from '@nestjs/mongoose';

console.log('Loading MongoDB configuration for Scrooge...');
export const getMongoConfig = (): MongooseModuleOptions => ({
    uri: process.env.MONGODB_SCROOGE_URI,
});
