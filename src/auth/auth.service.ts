import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { randomBytes, scryptSync } from 'crypto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(createUserDto.password, salt, 64).toString('hex');
    const password = `${salt}.${hash}`;

    const toCreate: CreateUserDto = {
      ...createUserDto,
      password,
    };

    const user = await this.usersService.create(toCreate);

    const response: RegisterResponseDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      about: user.about,
      birthdate: user.birthdate,
      city: user.city,
      gender: user.gender,
      avatar: user.avatar,
      skills: user.skills,
      wantToLearn: user.wantToLearn,
      favoriteSkills: user.favoriteSkills,
      role: user.role,
    };

    return response;
  }
}
