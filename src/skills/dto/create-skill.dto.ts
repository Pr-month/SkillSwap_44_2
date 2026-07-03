import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, MinLength, IsOptional } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ example: 'Игра на гитаре', description: 'Название навыка' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiPropertyOptional({
    example: 'Научу базовым аккордам и простым песням',
    description: 'Описание навыка',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: ['/uploads/guitar-1.png'],
    description: 'Массив публичных ссылок на изображения навыка',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  images?: string[];
}
