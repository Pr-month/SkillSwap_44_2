import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Музыкальные инструменты',
    description: 'Название категории',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    example: '9b7c1d2e-3f4a-4b5c-8d9e-123456789abc',
    description: 'UUID родительской категории, если создаётся подкатегория',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
