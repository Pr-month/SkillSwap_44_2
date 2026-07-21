import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CitySearchQuery {
  @ApiProperty({
    description: 'Частичное совпадение по названию города',
    required: false,
    example: 'Мос',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Частичное совпадение по району',
    required: false,
    example: 'Центр',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({
    description: 'Частичное совпадение по субъекту',
    required: false,
    example: 'Московская область',
  })
  @IsOptional()
  @IsString()
  subject?: string;
}
