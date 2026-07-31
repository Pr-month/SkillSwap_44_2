import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { DatabaseError } from 'pg';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { plainToClass } from 'class-transformer';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  // возвращает сырой Entity с паролем
  private async findOneEntity(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // возвращает DTO-объект без пароля
  async findOne(id: string): Promise<User> {
    const entity = await this.findOneEntity(id);
    return plainToClass(User, entity);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.usersRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        password: createUserDto.password,
        about: createUserDto.about,
        birthdate: new Date(createUserDto.birthdate),
        city: createUserDto.city,
        gender: createUserDto.gender,
        avatar: createUserDto.avatar,
        skills: createUserDto.skills || [],
        wantToLearn: createUserDto.wantToLearn || [],
        favoriteSkills: createUserDto.favoriteSkills || [],
      });
      return await this.usersRepository.save(user);
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e.driverError as DatabaseError).code === '23505'
      ) {
        throw new ConflictException('Email already in use');
      }
      throw e;
    }
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find();
    return users.map((u) => plainToClass(User, u));
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({ where: { email } });
    } catch (error) {
      console.log('error:', error);
      throw new InternalServerErrorException(
        `Не удалось выполнить поиск пользователя с email: ${email}`,
      );
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOneEntity(id);

    Object.assign(user, {
      ...updateUserDto,
      birthdate: updateUserDto.birthdate
        ? new Date(updateUserDto.birthdate)
        : user.birthdate,
    });

    try {
      const saved = await this.usersRepository.save(user);
      return plainToClass(User, saved);
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e.driverError as DatabaseError).code === '23505'
      ) {
        throw new ConflictException('Email already in use');
      }

      throw e;
    }
  }

  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'New password cannot be the same as the old one',
      );
    }

    const userEntity = await this.findOneEntity(userId);

    if (
      !(await this.authService.comparePasswords(
        oldPassword,
        userEntity.password,
      ))
    ) {
      throw new ForbiddenException('Old password is incorrect');
    }

    const newHash = await this.authService.hashPassword(newPassword);

    await this.usersRepository.update(userId, { password: newHash });
  }
}
