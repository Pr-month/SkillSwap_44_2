import { PaginationQueryDto } from './dto/pagination-query.dto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) { }

  async create(userId: string, createSkillDto: CreateSkillDto): Promise<Skill> {
    const owner = await this.usersRepository.findOneBy({ id: userId });
    if (!owner) {
      throw new NotFoundException('User not found');
    }

    const skill = this.skillsRepository.create({
      title: createSkillDto.title,
      description: createSkillDto.description || '',
      images: createSkillDto.images,
      owner,
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

  async update(id: string, updateSkillDto: UpdateSkillDto, userId: string): Promise<Skill> {
    // Загружаем навык вместе с владельцем
    const skill = await this.skillsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!skill) {
      throw new NotFoundException(`Skill #${id} not found`);
    }

    // Проверяем, что текущий пользователь — владелец
    if (skill.owner.id !== userId) {
      throw new ForbiddenException('Вы можете обновлять только свои навыки');
    }

    // Применяем изменения
    Object.assign(skill, updateSkillDto);

    try {
      return await this.skillsRepository.save(skill);
    } catch (e) {
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

  async addToFavorite(userId: string, skillId: string): Promise<void> {
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
    });
    if (!skill) {
      throw new NotFoundException(`Skill #${skillId} not found`);
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { favoriteSkills: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверка на дубликат
    const exists = user.favoriteSkills.some((s) => s.id === skillId);
    if (exists) {
      throw new ConflictException('Skill is already in favorites');
    }

    user.favoriteSkills.push(skill);
    await this.usersRepository.save(user);
  }

  async removeFromFavorites(skillId: string, userId: string): Promise<User> {
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
    });

    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { favoriteSkills: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    user.favoriteSkills = (user.favoriteSkills ?? []).filter(
      (favoriteSkill) => favoriteSkill.id !== skillId,
    );

    return this.usersRepository.save(user);
  }

  async removeFromFavorite(userId: string, skillId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { favoriteSkills: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const index = user.favoriteSkills.findIndex((s) => s.id === skillId);
    if (index === -1) {
      throw new NotFoundException(`Skill #${skillId} is not in favorites`);
    }

    user.favoriteSkills.splice(index, 1);
    await this.usersRepository.save(user);
  }

  async findSimilar(skillId: string): Promise<User[]> {
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
      relations: { category: true },
    });

    if (!skill || !skill.category) {
      return [];
    }

    const categoryId = skill.category.id;

    const users = await this.usersRepository.find({
      relations: { skills: true },
      where: {
        skills: {
          category: { id: categoryId },
        },
      },
      take: 10,
    });

    return users;
  }
}
