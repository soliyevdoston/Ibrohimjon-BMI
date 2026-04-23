import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CourierLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsOptional()
  @IsNumber()
  speedMps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  headingDeg?: number;
}
