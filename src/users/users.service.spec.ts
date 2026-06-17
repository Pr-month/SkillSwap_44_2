import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';

import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user by id', async () => {
    const user = {
      id: 'user-id',
      email: 'test@test.com',
    } as User;

    mockRepository.findOne.mockResolvedValue(user);

    const result = await service.findOne('user-id');

    expect(result).toEqual(user);

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'user-id',
      },
    });
  });

  it('should throw NotFoundException when user not found', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findOne('unknown-id'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should update user', async () => {
    const user = {
      id: 'user-id',
      name: 'Old name',
      birthdate: new Date('2000-01-01'),
    } as User;

    mockRepository.findOne.mockResolvedValue(user);

    mockRepository.save.mockImplementation(
      async (entity) => entity,
    );

    const result = await service.update('user-id', {
      name: 'New name',
    });

    expect(result.name).toBe('New name');

    expect(mockRepository.save).toHaveBeenCalled();
  });
});
