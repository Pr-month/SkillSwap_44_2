import { Test, TestingModule } from '@nestjs/testing';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';

describe('CitiesController', () => {
  let controller: CitiesController;

  const mockCitiesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CitiesController],
      providers: [
        {
          provide: CitiesService,
          useValue: mockCitiesService,
        },
      ],
    }).compile();

    controller = module.get<CitiesController>(CitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to service and return result', async () => {
      const dto = { name: 'Москва', lat: 55.7558, lon: 37.6173 };
      const created = { id: 'city-id', ...dto };

      mockCitiesService.create.mockResolvedValue(created);

      const result = await controller.create(dto as any);

      expect(result).toEqual(created);
      expect(mockCitiesService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should delegate to service with query and return result', async () => {
      const query = { name: 'Моск' };
      const cities = [{ id: 'city-id', name: 'Москва' }];

      mockCitiesService.findAll.mockResolvedValue(cities);

      const result = await controller.findAll(query as any);

      expect(result).toEqual(cities);
      expect(mockCitiesService.findAll).toHaveBeenCalledWith(query);
    });

    it('should delegate to service without query', async () => {
      mockCitiesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll({} as any);

      expect(result).toEqual([]);
      expect(mockCitiesService.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should delegate to service and return result', async () => {
      const city = { id: 'city-id', name: 'Москва' };

      mockCitiesService.findOne.mockResolvedValue(city);

      const result = await controller.findOne('city-id');

      expect(result).toEqual(city);
      expect(mockCitiesService.findOne).toHaveBeenCalledWith('city-id');
    });
  });

  describe('update', () => {
    it('should delegate to service and return result', async () => {
      const dto = { name: 'Новосибирск' };
      const updated = { id: 'city-id', name: 'Новосибирск' };

      mockCitiesService.update.mockResolvedValue(updated);

      const result = await controller.update('city-id', dto as any);

      expect(result).toEqual(updated);
      expect(mockCitiesService.update).toHaveBeenCalledWith('city-id', dto);
    });
  });

  describe('remove', () => {
    it('should delegate to service', async () => {
      mockCitiesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('city-id');

      expect(result).toBeUndefined();
      expect(mockCitiesService.remove).toHaveBeenCalledWith('city-id');
    });
  });
});
