import { TiktokOrderDto } from '@app/contracts/database-orderhub/tiktok_order.dto';
import { TiktokOrderItemDto } from '@app/contracts/database-orderhub/tiktok_order_item.dto';

export class PackageDto extends TiktokOrderDto {
    // Override the items property to include quantity
    declare items: (TiktokOrderItemDto & { quantity: number })[];
    // Add package-specific property
    packageId: string;
}
