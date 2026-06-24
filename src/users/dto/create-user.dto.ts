import { Skill } from 'src/skills/entities/skill.entity';
import { UserGender } from '../enums/users.enums';
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
  wantToLearn?: string[];
  @IsOptional()
  @IsArray()
  favoriteSkills?: Skill[];
  @IsOptional()
  @IsString()
  @MaxLength(500)
  refreshToken?: string | null;
}
