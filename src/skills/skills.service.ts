import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}

  async create(createSkillDto: CreateSkillDto): Promise<Skill> {
    const skill = this.skillsRepository.create(createSkillDto);
    try {
      return await this.skillsRepository.save(skill);
    } catch (e) {
      // Просто пробрасываем ошибку дальше. NestJS превратит её в 500 Internal Server Error      
      throw e;
    }
  }

  async findAll(): Promise<Skill[]> {
    return this.skillsRepository.find();
  }

  async findOne(id: string): Promise<Skill> {
    const skill = await this.skillsRepository.findOne({ where: { id } });
    if (!skill) {
      throw new NotFoundException(`Skill #${id} not found`);
    }
    return skill;
  }

  async update(id: string, updateSkillDto: UpdateSkillDto): Promise<Skill> {
    // Находим существующий навык по UUID
    const skill = await this.findOne(id);
    
    // Применяем переданные в DTO поля к найденной сущности (частичное обновление)
    Object.assign(skill, updateSkillDto);

    try {
      // Сохраняем изменения в БД через TypeORM
      return await this.skillsRepository.save(skill);
    } catch (e) {
      // Пробрасываем ошибку дальше — глобальный фильтр исключений NestJS обработает её
      throw e;
    }
  }

  async remove(id: string, userId: string): Promise<Skill> {
    const skill = await this.skillsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }

    if (skill.owner.id !== userId) {
      throw new ForbiddenException('Можно удалить только свой навык');
    }

    await this.skillsRepository.remove(skill);
    return skill;
  }
}
