import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { DatabaseError } from 'pg';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.usersRepository.create({
        ...createUserDto,
        birthdate: new Date(createUserDto.birthdate),
        skills: createUserDto.skills || [],
        wantToLearn: createUserDto.wantToLearn || [],
        favoriteSkills: createUserDto.favoriteSkills || [],
      });
      return this.usersRepository.save(user);
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
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, {
      ...updateUserDto,
      birthdate: updateUserDto.birthdate
        ? new Date(updateUserDto.birthdate)
        : user.birthdate,
    });

    try {
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

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
