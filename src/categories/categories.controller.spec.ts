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

  it('should call create', async () => {
    const dto = {
      name: 'IT',
    };

    await controller.create(dto);

    expect(mockCategoriesService.create).toHaveBeenCalledWith(dto);
  });

  it('should call findAll', async () => {
    await controller.findAll();

    expect(mockCategoriesService.findAll).toHaveBeenCalled();
  });

  it('should call findOne', async () => {
    await controller.findOne('category-id');

    expect(mockCategoriesService.findOne).toHaveBeenCalledWith('category-id');
  });

  it('should call update', async () => {
    const dto = {
      name: 'Backend',
    };

    await controller.update('category-id', dto);

    expect(mockCategoriesService.update).toHaveBeenCalledWith(
      'category-id',
      dto,
    );
  });

  it('should call remove', async () => {
    await controller.remove('category-id');

    expect(mockCategoriesService.remove).toHaveBeenCalledWith('category-id');
  });
});
