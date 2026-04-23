import { IsIn, IsOptional, IsString } from 'class-validator';

export class SellerUpdateOrderStatusDto {
  @IsIn(['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'])
  status!: 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP';

  @IsOptional()
  @IsString()
  note?: string;
}
