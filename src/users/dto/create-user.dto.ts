import { UserGender } from '../enums/users.enums';
import { Skill } from '../../skills/entities/skill.entity';
import { Category } from '../../categories/entities/category.entity';
import {
  MinLength,
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @MinLength(2)
  @IsString()
  name: string;
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(6)
  password: string;
  @IsString()
  @IsOptional()
  about?: string;
  @IsString()
  birthdate: string;
  @IsString()
  city: string;
  @IsEnum(UserGender)
  gender: UserGender;
  @IsString()
  @IsOptional()
  avatar?: string;
  @IsOptional()
  @IsArray()
  skills?: Skill[];
  @IsOptional()
  @IsArray()
  wantToLearn?: Category[];
  @IsOptional()
  @IsArray()
  favoriteSkills?: Skill[];
  @IsOptional()
  @IsString()
  @MaxLength(500)
  refreshToken?: string | null;
}
