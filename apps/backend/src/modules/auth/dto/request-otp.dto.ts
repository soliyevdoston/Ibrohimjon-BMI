import { IsEnum, IsPhoneNumber } from 'class-validator';
import { OtpPurpose } from '@prisma/client';

export class RequestOtpDto {
  @IsPhoneNumber('UZ')
  phone!: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose = OtpPurpose.LOGIN;
}
