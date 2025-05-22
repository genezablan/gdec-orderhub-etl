import { Injectable } from '@nestjs/common';

@Injectable()
export class TiktokLoaderService {
  getHello(): string {
    return 'Hello World!';
  }
}
