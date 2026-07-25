import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { FindManyOptions } from 'typeorm';

import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';

describe('CitiesService', () => {
  let service: CitiesService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitiesService,
        {
          provide: getRepositoryToken(City),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CitiesService>(CitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCityDto = {
      name: 'Москва',
      lat: 55.7558,
      lon: 37.6173,
      district: 'Центральный',
      population: 12615882,
      subject: 'Москва',
    };

    it('should create and return a new city', async () => {
      const createdCity = { id: 'city-id', ...createCityDto } as City;

      mockRepository.create.mockReturnValue(createdCity);
      mockRepository.save.mockResolvedValue(createdCity);

      const result = await service.create(createCityDto);

      expect(result).toEqual(createdCity);
      expect(mockRepository.create).toHaveBeenCalledWith(createCityDto);
      expect(mockRepository.save).toHaveBeenCalledWith(createdCity);
    });

    it('should throw ConflictException on duplicate name (23505)', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(
        new QueryFailedError('', undefined, { code: '23505' } as any),
      );

      await expect(service.create(createCityDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw non-duplicate database errors', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(new Error('Connection lost'));

      await expect(service.create(createCityDto)).rejects.toThrow(
        'Connection lost',
      );
    });

    it('should re-throw QueryFailedError with non-23505 code', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(
        new QueryFailedError('', undefined, { code: '23503' } as any),
      );

      await expect(service.create(createCityDto)).rejects.toThrow(
        QueryFailedError,
      );
    });
  });

  describe('findAll', () => {
    it('should return all cities ordered by name ASC', async () => {
      const cities = [
        { id: '1', name: 'Москва' },
        { id: '2', name: 'Санкт-Петербург' },
      ] as City[];

      mockRepository.find.mockResolvedValue(cities);

      const result = await service.findAll();

      expect(result).toEqual(cities);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: undefined,
        order: { name: 'ASC' },
      });
    });

    it('should filter by name using LIKE', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findAll({ name: 'Моск' });

      const calls = mockRepository.find.mock.calls as [FindManyOptions<City>][];

      expect(calls).toHaveLength(1);

      const callArgs = calls[0][0];

      expect(callArgs.order).toEqual({ name: 'ASC' });
      expect(callArgs.where).toBeDefined();
      expect('name' in callArgs.where!).toBe(true);
    });

    it('should filter by district using LIKE', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findAll({ district: 'Центр' });

      const calls = mockRepository.find.mock.calls as [FindManyOptions<City>][];
      expect(calls).toHaveLength(1);
      const callArgs = calls[0][0];

      expect(callArgs.order).toEqual({ name: 'ASC' });
      expect(callArgs.where).toBeDefined();
      expect('district' in callArgs.where!).toBe(true);
    });

    it('should filter by subject using LIKE', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findAll({ subject: 'область' });

      const calls = mockRepository.find.mock.calls as [FindManyOptions<City>][];
      expect(calls).toHaveLength(1);
      const callArgs = calls[0][0];

      expect(callArgs.order).toEqual({ name: 'ASC' });
      expect(callArgs.where).toBeDefined();
      expect('subject' in callArgs.where!).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a city by id', async () => {
      const city = { id: 'city-id', name: 'Москва' } as City;

      mockRepository.findOne.mockResolvedValue(city);

      const result = await service.findOne('city-id');

      expect(result).toEqual(city);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'city-id' },
      });
    });

    it('should return null when city not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('unknown-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update city fields', async () => {
      const city = { id: 'city-id', name: 'Old name' } as City;
      const updated = { id: 'city-id', name: 'New name' } as City;

      mockRepository.findOne.mockResolvedValue(city);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('city-id', { name: 'New name' });

      expect(result).toEqual(updated);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when city not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown-id', { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate name (23505)', async () => {
      const city = { id: 'city-id', name: 'Old name' } as City;

      mockRepository.findOne.mockResolvedValue(city);
      mockRepository.save.mockRejectedValue(
        new QueryFailedError('', undefined, { code: '23505' } as any),
      );

      await expect(
        service.update('city-id', { name: 'Duplicate' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should re-throw non-duplicate database errors on update', async () => {
      const city = { id: 'city-id', name: 'Old name' } as City;

      mockRepository.findOne.mockResolvedValue(city);
      mockRepository.save.mockRejectedValue(new Error('Connection lost'));

      await expect(
        service.update('city-id', { name: 'New name' }),
      ).rejects.toThrow('Connection lost');
    });
  });

  describe('remove', () => {
    it('should delete a city', async () => {
      const city = { id: 'city-id', name: 'Москва' } as City;

      mockRepository.findOne.mockResolvedValue(city);
      mockRepository.remove.mockResolvedValue(city);

      await service.remove('city-id');

      expect(mockRepository.remove).toHaveBeenCalledWith(city);
    });

    it('should throw NotFoundException when city to delete not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when city has related records (23503)', async () => {
      const city = { id: 'city-id', name: 'Москва' } as City;

      mockRepository.findOne.mockResolvedValue(city);
      mockRepository.remove.mockRejectedValue(
        new QueryFailedError('', undefined, { code: '23503' } as any),
      );

      await expect(service.remove('city-id')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw non-foreign-key database errors on remove', async () => {
      const city = { id: 'city-id', name: 'Москва' } as City;

      mockRepository.findOne.mockResolvedValue(city);
      mockRepository.remove.mockRejectedValue(new Error('Connection lost'));

      await expect(service.remove('city-id')).rejects.toThrow(
        'Connection lost',
      );
    });
  });
});
