import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return category by id', async () => {
    const category = {
      id: 'category-id',
      name: 'IT',
      children: [],
    } as Category;

    mockRepository.findOne.mockResolvedValue(category);

    const result = await service.findOne('category-id');

    expect(result).toEqual(category);
  });

  it('should throw NotFoundException when category not found', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('unknown-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create category', async () => {
    const dto = {
      name: 'Backend',
    };

    const category = {
      id: 'new-id',
      ...dto,
    };

    mockRepository.create.mockReturnValue(category);
    mockRepository.save.mockResolvedValue(category);

    const result = await service.create(dto);

    expect(result).toEqual(category);

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should update category', async () => {
    const category = {
      id: 'category-id',
      name: 'Old name',
      children: [],
    } as Category;

    mockRepository.findOne.mockResolvedValue(category);
    mockRepository.save.mockImplementation(async (entity) => entity);

    const result = await service.update('category-id', {
      name: 'New name',
    });

    expect(result.name).toBe('New name');
  });

  it('should remove category', async () => {
    const category = {
      id: 'category-id',
      name: 'IT',
      children: [],
    } as Category;

    mockRepository.findOne.mockResolvedValue(category);
    mockRepository.remove.mockResolvedValue(category);

    await service.remove('category-id');

    expect(mockRepository.remove).toHaveBeenCalledWith(category);
  });

  it('should throw ConflictException when category has children', async () => {
    const category = {
      id: 'category-id',
      children: [
        {
          id: 'child-id',
        },
      ],
    } as Category;

    mockRepository.findOne.mockResolvedValue(category);

    await expect(service.remove('category-id')).rejects.toThrow(
      ConflictException,
    );
  });

  it('should throw ConflictException when category becomes its own parent', async () => {
    const category = {
      id: 'category-id',
      name: 'IT',
      children: [],
    } as Category;

    mockRepository.findOne.mockResolvedValue(category);

    await expect(
      service.update('category-id', {
        parentId: 'category-id',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
