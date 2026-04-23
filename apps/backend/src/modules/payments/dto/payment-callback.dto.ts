import { IsIn, IsString, IsUUID } from 'class-validator';

export class PaymentCallbackDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  callbackId!: string;

  @IsString()
  externalPaymentId!: string;

  @IsIn(['paid', 'failed'])
  status!: 'paid' | 'failed';

  @IsString()
  signature!: string;

  @IsString()
  rawPayload!: string;
}
