import { IsIn } from 'class-validator';

export class UpdateDeliveryStatusDto {
  @IsIn(['PICKED_UP', 'ON_THE_WAY', 'DELIVERED'])
  status!: 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED';
}
