import { IsString, IsArray, MinLength } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  description?: string;

  @IsArray()
  images?: string[];
}
