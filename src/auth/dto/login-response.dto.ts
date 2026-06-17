import { UserGender, UserRole } from '../../users/enums/users.enums';

export class LoginResponseDto {
  success: boolean;

  user: {
    id: string;
    name: string;
    email: string;
    about?: string;
    birthdate: Date;
    city: string;
    gender: UserGender;
    avatar?: string;
    skills: string[];
    wantToLearn: string[];
    favoriteSkills: string[];
    role: UserRole;
  };

  accessToken: string;
}
