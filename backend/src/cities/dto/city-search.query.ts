import { ApiProperty } from '@nestjs/swagger';

export class CitySearchQuery {
  @ApiProperty({
    description: 'Частичное совпадение по названию города',
    required: false,
    example: 'Мос',
  })
  name?: string;

  @ApiProperty({
    description: 'Частичное совпадение по району',
    required: false,
    example: 'Центр',
  })
  district?: string;

  @ApiProperty({
    description: 'Частичное совпадение по субъекту',
    required: false,
    example: 'Московская область',
  })
  subject?: string;
}
