import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsUUID()
  sellerId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsString()
  deliveryAddressText!: string;

  @IsNumber()
  deliveryLat!: number;

  @IsNumber()
  deliveryLng!: number;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{10,80}$/)
  idempotencyKey!: string;

  @IsIn(['cash', 'card', 'payme', 'click'])
  paymentMethod!: 'cash' | 'card' | 'payme' | 'click';

  @IsOptional()
  @IsUUID()
  customerCardId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
