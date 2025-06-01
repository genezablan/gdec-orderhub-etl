import { TiktokOrderItemDto } from '@app/contracts/database-orderhub/tiktok_order_item.dto';

export class PackageItemsDto {
    packageId: string;
    items: (TiktokOrderItemDto & { quantity: number })[];
}

export class ItemsByPackageDto {
    [packageId: string]: (TiktokOrderItemDto & { quantity: number })[];
}
