import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lon?: number;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsNumber()
  population?: number;

  @IsOptional()
  @IsString()
  subject?: string;
}
