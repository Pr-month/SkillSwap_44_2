import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}
  create(createSkillDto: CreateSkillDto) {
    return 'This action adds a new skill';
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

  findOne(id: number) {
    return `This action returns a #${id} skill`;
  }

  update(id: number, updateSkillDto: UpdateSkillDto) {
    return `This action updates a #${id} skill`;
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
  }
}
