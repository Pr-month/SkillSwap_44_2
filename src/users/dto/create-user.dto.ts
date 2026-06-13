import { UserGender } from '../enums/users.enums';

export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  about?: string;
  birthdate: string;
  city: string;
  gender: UserGender;
  avatar?: string;
  skills?: string[];
  wantToLearn?: string[];
  favoriteSkills?: string[];
}
