import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiGatewayService {
    constructor() {}
    getHello(): string {
        return 'Hello World';
    }
}
