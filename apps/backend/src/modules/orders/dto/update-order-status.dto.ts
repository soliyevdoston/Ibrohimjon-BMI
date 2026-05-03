import { IsIn, IsOptional, IsString } from 'class-validator';

export class SellerUpdateOrderStatusDto {
  @IsIn(['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELED'])
  status!: 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'CANCELED';

  @IsOptional()
  @IsString()
  note?: string;
}
