import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Иван Иванов', description: 'Имя пользователя' })
  @MinLength(2)
  @IsString()
  name: string;

  @ApiProperty({
    example: 'ivan@example.com',
    description: 'Email пользователя',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123', description: 'Пароль пользователя' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'Frontend-разработчик, хочу учить английский',
  })
  @IsString()
  @IsOptional()
  about?: string;

  @ApiProperty({ example: '1999-01-01', description: 'Дата рождения' })
  @IsString()
  birthdate: string;

  @ApiProperty({ example: 'Ханты-Мансийск', description: 'Город пользователя' })
  @IsString()
  city: string;

  @ApiProperty({
    enum: UserGender,
    example: UserGender.MALE,
    description: 'Пол пользователя',
  })
  @IsEnum(UserGender)
  gender: UserGender;

  @ApiPropertyOptional({
    example: '/uploads/avatar.png',
    description: 'Ссылка на аватар',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ type: [Skill], description: 'Навыки пользователя' })
  @IsOptional()
  @IsArray()
  skills?: Skill[];

  @ApiPropertyOptional({
    type: [Category],
    description: 'Категории, которым пользователь хочет научиться',
  })
  @IsOptional()
  @IsArray()
  wantToLearn?: Category[];

  @ApiPropertyOptional({
    type: [Skill],
    description: 'Избранные навыки пользователя',
  })
  @IsOptional()
  @IsArray()
  favoriteSkills?: Skill[];

  @ApiPropertyOptional({ description: 'Refresh token пользователя' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  refreshToken?: string | null;
}
