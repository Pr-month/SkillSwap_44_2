import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
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

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        id,
      },
    });
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

  async update(id: string, user: UpdateUserDto): Promise<void> {
    try {
      const result = await this.usersRepository.update(id, user);
      if (result.affected === 0) {
        throw new NotFoundException(`Пользователь с ID ${id} не найден`);
      }
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException('Некорректные данные для обновления');
      }
      throw new InternalServerErrorException(
        'Не удалось обновить пользователя',
      );
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
