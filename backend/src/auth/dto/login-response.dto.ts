import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../categories/entities/category.entity';
import { Skill } from '../../skills/entities/skill.entity';
import { UserGender, UserRole } from '../../users/enums/users.enums';

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: {
      id: '9b7c1d2e-3f4a-4b5c-8d9e-123456789abc',
      name: 'Иван Иванов',
      email: 'ivan@example.com',
      about: 'Frontend-разработчик',
      birthdate: '1999-01-01',
      city: 'Москва',
      gender: UserGender.MALE,
      avatar: '/uploads/avatar.png',
      role: UserRole.USER,
    },
  })
  user: {
    id: string;
    name: string;
    email: string;
    about?: string;
    birthdate: Date;
    city: string;
    gender: UserGender;
    avatar?: string;
    skills: Skill[];
    wantToLearn: Category[];
    favoriteSkills: Skill[];
    role: UserRole;
  };

  @ApiProperty({ example: 'jwt-access-token' })
  accessToken: string;
}
