import { Injectable } from '@nestjs/common';
@Injectable()
export class TiktokReceiptService {
    constructor() {}
    getHello(): string {
        return 'Hello World!';
    }
}
