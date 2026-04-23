import { IsPhoneNumber, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsPhoneNumber('UZ')
  phone!: string;

  @Matches(/^\d{4,6}$/)
  code!: string;
}
