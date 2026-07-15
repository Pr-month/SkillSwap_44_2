import { Test, TestingModule } from '@nestjs/testing';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

describe('SkillsController', () => {
  let controller: SkillsController;

  const mockSkillsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addToFavorite: jest.fn(),
    removeFromFavorite: jest.fn(),
    findSimilar: jest.fn(),
  };

  const mockReq = (overrides = {}) => ({
    user: { sub: 'user-id', ...overrides },
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [
        { provide: SkillsService, useValue: mockSkillsService },
      ],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to service with userId and dto', async () => {
      const dto = { title: 'Guitar' };
      const created = { id: 's-1', title: 'Guitar' };

      mockSkillsService.create.mockResolvedValue(created);

      const result = await controller.create(mockReq() as any, dto);

      expect(result).toEqual(created);
      expect(mockSkillsService.create).toHaveBeenCalledWith('user-id', dto);
    });
  });

  describe('findAll', () => {
    it('should delegate to service with pagination query', async () => {
      const query = { page: 1, limit: 10 };
      const resultData = { data: [], page: 1, limit: 10, total: 0, totalPages: 0 };

      mockSkillsService.findAll.mockResolvedValue(resultData);

      const result = await controller.findAll(query);

      expect(result).toEqual(resultData);
      expect(mockSkillsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should delegate to service with id', async () => {
      const skill = { id: 's-1', title: 'Guitar' };

      mockSkillsService.findOne.mockResolvedValue(skill);

      const result = await controller.findOne('s-1');

      expect(result).toEqual(skill);
      expect(mockSkillsService.findOne).toHaveBeenCalledWith('s-1');
    });
  });

  describe('update', () => {
    it('should delegate to service with id and dto', async () => {
      const dto = { title: 'New' };
      const updated = { id: 's-1', title: 'New' };

      mockSkillsService.update.mockResolvedValue(updated);

      const result = await controller.update('s-1', dto);

      expect(result).toEqual(updated);
      expect(mockSkillsService.update).toHaveBeenCalledWith('s-1', dto);
    });
  });

  describe('remove', () => {
    it('should delegate to service with id and userId', async () => {
      const skill = { id: 's-1' };

      mockSkillsService.remove.mockResolvedValue(skill);

      const result = await controller.remove('s-1', mockReq() as any);

      expect(result).toEqual(skill);
      expect(mockSkillsService.remove).toHaveBeenCalledWith('s-1', 'user-id');
    });
  });

  describe('addToFavorite', () => {
    it('should delegate to service and return success message', async () => {
      mockSkillsService.addToFavorite.mockResolvedValue(undefined);

      const result = await controller.addToFavorite('s-1', mockReq() as any);

      expect(result).toEqual({ message: 'Skill added to favorites' });
      expect(mockSkillsService.addToFavorite).toHaveBeenCalledWith('user-id', 's-1');
    });
  });

  describe('removeFromFavorite', () => {
    it('should delegate to service and return success message', async () => {
      mockSkillsService.removeFromFavorite.mockResolvedValue(undefined);

      const result = await controller.removeFromFavorite('s-1', mockReq() as any);

      expect(result).toEqual({ message: 'Skill removed from favorites' });
      expect(mockSkillsService.removeFromFavorite).toHaveBeenCalledWith('user-id', 's-1');
    });
  });

  describe('findSimilar', () => {
    it('should delegate to service with id', async () => {
      const users = [{ id: 'u-1' }];

      mockSkillsService.findSimilar.mockResolvedValue(users);

      const result = await controller.findSimilar('s-1');

      expect(result).toEqual(users);
      expect(mockSkillsService.findSimilar).toHaveBeenCalledWith('s-1');
    });
  });
});