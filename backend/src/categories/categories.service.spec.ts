import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { FindManyOptions, FindOneOptions } from 'typeorm';

import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { UpdateCategoryDto } from './dto/update-category.dto';

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

  describe('findAll', () => {
    it('should return root categories with children', async () => {
      const categories = [
        {
          id: 'cat-1',
          name: 'IT',
          parent: null,
          parentId: undefined,
          children: [
            {
              id: 'sub-1',
              name: 'Backend',
              parent: null,
              parentId: undefined,
              children: [],
              usersWhoWantToLearn: [],
            },
          ],
          usersWhoWantToLearn: [],
        },
        {
          id: 'cat-2',
          name: 'Music',
          parent: null,
          parentId: undefined,
          children: [],
          usersWhoWantToLearn: [],
        },
      ] as unknown as Category[];

      mockRepository.find.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(result).toEqual(categories);

      const calls = mockRepository.find.mock.calls as [
        FindManyOptions<Category>,
      ][];
      expect(calls).toHaveLength(1);

      const args = calls[0][0];
      expect(args.relations).toEqual({ children: true });
      expect('parent' in args.where!).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const category = {
        id: 'category-id',
        name: 'IT',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne.mockResolvedValue(category);

      const result = await service.findOne('category-id');

      expect(result).toEqual(category);

      const calls = mockRepository.findOne.mock.calls as [
        FindOneOptions<Category>,
      ][];
      expect(calls).toHaveLength(1);
      const args = calls[0][0];

      expect(args.where).toEqual({ id: 'category-id' });
      expect(args.relations).toEqual({ parent: true, children: true });
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a root category without parentId', async () => {
      const dto = { name: 'Backend' };
      const category = {
        id: 'new-id',
        name: 'Backend',
        parent: undefined,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.create.mockReturnValue(category);
      mockRepository.save.mockResolvedValue(category);

      const result = await service.create(dto);

      expect(result).toEqual(category);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Backend',
        parent: undefined,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(category);
    });

    it('should create a subcategory with valid parentId', async () => {
      const parentCategory = {
        id: 'parent-id',
        name: 'IT',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      const dto = { name: 'Backend', parentId: 'parent-id' };

      const subCategory = {
        id: 'child-id',
        name: 'Backend',
        parent: parentCategory,
        parentId: 'parent-id',
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne.mockResolvedValue(parentCategory);
      mockRepository.create.mockReturnValue(subCategory);
      mockRepository.save.mockResolvedValue(subCategory);

      const result = await service.create(dto);

      expect(result).toEqual(subCategory);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Backend',
        parent: parentCategory,
      });
    });

    it('should throw NotFoundException when parent category does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(
        service.create({ name: 'Backend', parentId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate name (PG error 23505)', async () => {
      const dto = { name: 'Backend' };
      const category = {
        id: 'new-id',
        name: 'Backend',
        parent: undefined,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.create.mockReturnValue(category);
      mockRepository.save.mockRejectedValue(
        new QueryFailedError('', undefined, { code: '23505' } as any),
      );

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should re-throw non-duplicate database errors', async () => {
      const dto = { name: 'Backend' };
      const category = {
        id: 'new-id',
        name: 'Backend',
        parent: undefined,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;
      const genericError = new Error('DB connection lost');

      mockRepository.create.mockReturnValue(category);
      mockRepository.save.mockRejectedValue(genericError);

      await expect(service.create(dto)).rejects.toThrow('DB connection lost');
    });
  });

  describe('update', () => {
    it('should update category name', async () => {
      const category = {
        id: 'category-id',
        name: 'Old name',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne.mockResolvedValue(category);
      mockRepository.save.mockResolvedValue({ ...category, name: 'New name' });

      const result = await service.update('category-id', {
        name: 'New name',
      });
      expect(result.name).toBe('New name');
    });

    it('should update parentId to a valid parent category', async () => {
      const category = {
        id: 'category-id',
        name: 'Backend',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      const newParent = {
        id: 'parent-id',
        name: 'IT',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(newParent);

      mockRepository.save.mockResolvedValue({
        ...category,
        parent: newParent,
        parentId: newParent.id,
      });

      const result = await service.update('category-id', {
        parentId: 'parent-id',
      });

      expect(result.parent).toEqual(newParent);
    });

    it('should clear parent when parentId is set to undefined', async () => {
      const category = {
        id: 'category-id',
        name: 'Backend',
        parent: {
          id: 'parent-id',
          name: '',
          parent: null,
          parentId: undefined,
          children: [],
          usersWhoWantToLearn: [],
        } as unknown as Category,
        parentId: 'parent-id',
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne.mockResolvedValue(category);
      mockRepository.save.mockResolvedValue({
        ...category,
        parent: null,
        parentId: null,
      });

      const updatePayload: UpdateCategoryDto = { parentId: undefined };
      const result = await service.update('category-id', updatePayload);

      expect(result.parent).toBeNull();
    });

    it('should throw ConflictException when category becomes its own parent', async () => {
      const category = {
        id: 'category-id',
        name: 'IT',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne.mockResolvedValue(category);
      await expect(
        service.update('category-id', {
          parentId: 'category-id',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when category to update does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(
        service.update('unknown-id', { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when new parentId does not exist', async () => {
      const category = {
        id: 'category-id',
        name: 'Backend',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(null);

      await expect(
        service.update('category-id', {
          parentId: 'nonexistent-parent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate name', async () => {
      const category = {
        id: 'category-id',
        name: 'Old name',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne.mockResolvedValue(category);
      mockRepository.save.mockRejectedValue(
        new QueryFailedError('', undefined, { code: '23505' } as any),
      );

      await expect(
        service.update('category-id', {
          name: 'Duplicated name',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should re-throw non-duplicate database errors on update', async () => {
      const category = {
        id: 'category-id',
        name: 'Old name',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne.mockResolvedValue(category);
      mockRepository.save.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        service.update('category-id', {
          name: 'New name',
        }),
      ).rejects.toThrow('DB connection lost');
    });
  });

  describe('remove', () => {
    it('should delete a category without children', async () => {
      const category = {
        id: 'category-id',
        name: 'IT',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne.mockResolvedValue(category);
      mockRepository.remove.mockResolvedValue(category);

      await service.remove('category-id');
      expect(mockRepository.remove).toHaveBeenCalledWith(category);
    });

    it('should throw NotFoundException when category to delete does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.remove('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when category has children', async () => {
      const child = {
        id: 'child-id',
        name: 'Child',
        parent: null,
        parentId: undefined,
        children: [],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      const category = {
        id: 'category-id',
        name: 'Parent',
        parent: null,
        parentId: undefined,
        children: [child],
        usersWhoWantToLearn: [],
      } as unknown as Category;

      mockRepository.findOne.mockResolvedValue(category);
      await expect(service.remove('category-id')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
