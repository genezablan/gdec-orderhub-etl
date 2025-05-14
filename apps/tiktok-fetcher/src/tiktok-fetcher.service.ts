import { Injectable } from '@nestjs/common';

@Injectable()
export class TiktokFetcherService {
  getHello(): string {
    return 'Hello World from tiktok-fetcher!';
  }
}
