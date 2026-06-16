import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { DatabaseError } from 'pg';
import { User } from './entities/user.entity';

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

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
