import { SetMetadata } from '@nestjs/common';

export const SKIP_ACCESS_CHECK_KEY = 'skipAccessCheck';
export const SkipAccessCheck = () => SetMetadata(SKIP_ACCESS_CHECK_KEY, true);
