import { IsOptional, IsString, MinLength, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
