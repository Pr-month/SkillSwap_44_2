import { PaginationQueryDto } from './dto/pagination-query.dto';
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

  create(userId: string, createSkillDto: CreateSkillDto): Promise<Skill> {
    const skill = this.skillsRepository.create({
      title: createSkillDto.title,
      description: createSkillDto.description || '', // не знаю обязательное ли это поле
      images: createSkillDto.images,
      owner: { id: userId },
    });

    return this.skillsRepository.save(skill);
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit } = query;

    const [data, total] = await this.skillsRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    if (total > 0 && page > totalPages) {
      throw new NotFoundException('Страница не найдена');
    }

    return {
      data,
      page,
      limit,
      total,
      totalPages,
    };
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
      relations: { owner: true },
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
