import { Injectable } from '@nestjs/common';

@Injectable()
export class TiktokTransformerService {
    getHello(): string {
        return 'Hello World!';
    }
}
