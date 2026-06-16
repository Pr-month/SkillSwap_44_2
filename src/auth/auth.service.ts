import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    const password = await bcrypt.hash(createUserDto.password, 10);

    const toCreate: CreateUserDto = {
      ...createUserDto,
      password,
    };

    return this.usersService.create(toCreate);
  }

    public async logout(id: string) {
    return this.usersService.update(id, { refreshToken: null });
  }
}
