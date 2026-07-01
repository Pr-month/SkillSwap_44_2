import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, QueryFailedError } from 'typeorm';
import { Category } from './entities/category.entity';
import { DatabaseError } from 'pg';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    let parent: Category | null = null;

    if (createCategoryDto.parentId) {
      parent = await this.findOne(createCategoryDto.parentId);
    }

    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      parent: parent ?? undefined,
    });

    try {
      return await this.categoryRepository.save(category);
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e.driverError as DatabaseError).code === '23505'
      ) {
        throw new ConflictException('Category already exists');
      }

      throw e;
    }
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: {
        parent: IsNull(),
      },
      relations: {
        children: true,
      },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name !== undefined) {
      category.name = updateCategoryDto.name;
    }

    if (updateCategoryDto.parentId === id) {
      throw new ConflictException('Category cannot be parent of itself');
    }

    if (updateCategoryDto.parentId !== undefined) {
      category.parent = updateCategoryDto.parentId
        ? await this.findOne(updateCategoryDto.parentId)
        : null;
    }

    try {
      return await this.categoryRepository.save(category);
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e.driverError as DatabaseError).code === '23505'
      ) {
        throw new ConflictException('Category already exists');
      }

      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    if (category.children.length > 0) {
      throw new ConflictException('Cannot delete category with children');
    }

    await this.categoryRepository.remove(category);
  }
}
