import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const mockCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to service and return result', async () => {
      const dto = { name: 'IT' };
      const created = { id: '1', name: 'IT' };

      mockCategoriesService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toEqual(created);
      expect(mockCategoriesService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should delegate to service and return result', async () => {
      const categories = [{ id: '1', name: 'IT' }];

      mockCategoriesService.findAll.mockResolvedValue(categories);

      const result = await controller.findAll();

      expect(result).toEqual(categories);
      expect(mockCategoriesService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should delegate to service and return result', async () => {
      const category = { id: 'category-id', name: 'IT' };

      mockCategoriesService.findOne.mockResolvedValue(category);

      const result = await controller.findOne('category-id');

      expect(result).toEqual(category);
      expect(mockCategoriesService.findOne).toHaveBeenCalledWith('category-id');
    });
  });

  describe('update', () => {
    it('should delegate to service and return result', async () => {
      const dto = { name: 'Backend' };
      const updated = { id: 'category-id', name: 'Backend' };

      mockCategoriesService.update.mockResolvedValue(updated);

      const result = await controller.update('category-id', dto);

      expect(result).toEqual(updated);
      expect(mockCategoriesService.update).toHaveBeenCalledWith(
        'category-id',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('should delegate to service', async () => {
      mockCategoriesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('category-id');

      expect(result).toBeUndefined();
      expect(mockCategoriesService.remove).toHaveBeenCalledWith('category-id');
    });
  });
});
