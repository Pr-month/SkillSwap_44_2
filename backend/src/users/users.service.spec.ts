import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { UserGender } from './enums/users.enums';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockAuthService = {
    comparePasswords: jest.fn(),
    hashPassword: jest.fn(),
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
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = {
      name: 'Иван Иванов',
      email: 'ivan@example.com',
      password: 'Password123',
      birthdate: '1999-01-01',
      city: 'Москва',
      gender: UserGender.MALE,
    };

    it('should create and return a new user', async () => {
      const createdUser = {
        id: 'user-id',
        ...createUserDto,
        birthdate: new Date('1999-01-01'),
        skills: [],
        wantToLearn: [],
        favoriteSkills: [],
      } as unknown as User;

      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(createdUser);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Иван Иванов',
        email: 'ivan@example.com',
        password: 'Password123',
        about: undefined,
        birthdate: new Date('1999-01-01'),
        city: 'Москва',
        gender: UserGender.MALE,
        avatar: undefined,
        skills: [],
        wantToLearn: [],
        favoriteSkills: [],
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
    });

    it('should throw ConflictException on duplicate email (23505)', async () => {
      const qe = new QueryFailedError(
        'SELECT 1',
        [] as any,
        { code: '23505' } as any,
      );

      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(qe);

      await expect(service.create(createUserDto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw non-duplicate database errors', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(new Error('Connection lost'));

      await expect(service.create(createUserDto as any)).rejects.toThrow(
        'Connection lost',
      );
    });

    it('should re-throw non-QueryFailedError errors', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(new Error('Something went wrong'));

      await expect(service.create(createUserDto as any)).rejects.toThrow(
        'Something went wrong',
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' },
      ] as User[];

      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      const user = { id: 'user-id', email: 'test@test.com' } as User;

      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('user-id');

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const user = { id: 'user-id', email: 'test@test.com' } as User;

      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@test.com');

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
    });

    it('should return null when email not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@test.com');

      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.findOne.mockRejectedValue(
        new Error('DB connection failed'),
      );

      await expect(service.findByEmail('test@test.com')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const user = {
        id: 'user-id',
        name: 'Old name',
        email: 'old@test.com',
        birthdate: new Date('2000-01-01'),
      } as User;

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockImplementation(async (entity) => entity);

      const result = await service.update('user-id', { name: 'New name' });

      expect(result.name).toBe('New name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should convert birthdate string to Date when updating', async () => {
      const user = {
        id: 'user-id',
        name: 'User',
        birthdate: new Date('2000-01-01'),
      } as User;

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockImplementation(async (entity) => entity);

      const result = await service.update('user-id', {
        birthdate: '1995-05-15',
      });

      expect(result.birthdate).toEqual(new Date('1995-05-15'));
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown-id', { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate email (23505)', async () => {
      const user = {
        id: 'user-id',
        name: 'User',
        email: 'old@test.com',
      } as User;
      const qe = new QueryFailedError(
        'SELECT 1',
        [] as any,
        { code: '23505' } as any,
      );

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockRejectedValue(qe);

      await expect(
        service.update('user-id', { email: 'taken@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should re-throw non-duplicate database errors on update', async () => {
      const user = { id: 'user-id', name: 'User' } as User;

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockRejectedValue(new Error('Connection lost'));

      await expect(
        service.update('user-id', { name: 'New name' }),
      ).rejects.toThrow('Connection lost');
    });
  });

  describe('updatePassword', () => {
    it('should update password when old password matches', async () => {
      const user = { id: 'user-id', password: 'hashed-old' } as User;

      mockRepository.findOne.mockResolvedValue(user);
      mockAuthService.comparePasswords.mockResolvedValue(true);
      mockAuthService.hashPassword.mockResolvedValue('hashed-new');

      await service.updatePassword('user-id', 'old-pass', 'NewPass123');

      expect(mockAuthService.comparePasswords).toHaveBeenCalledWith(
        'old-pass',
        'hashed-old',
      );
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith('NewPass123');
      expect(mockRepository.update).toHaveBeenCalledWith('user-id', {
        password: 'hashed-new',
      });
    });

    it('should throw ForbiddenException when old password is incorrect', async () => {
      const user = { id: 'user-id', password: 'hashed-old' } as User;

      mockRepository.findOne.mockResolvedValue(user);
      mockAuthService.comparePasswords.mockResolvedValue(false);

      await expect(
        service.updatePassword('user-id', 'wrong-old', 'NewPass123'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockAuthService.hashPassword).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when new password equals old password', async () => {
      const user = { id: 'user-id', password: 'hashed-old' } as User;

      mockRepository.findOne.mockResolvedValue(user);
      mockAuthService.comparePasswords.mockResolvedValue(true);

      await expect(
        service.updatePassword('user-id', 'SamePass1', 'SamePass1'),
      ).rejects.toThrow(BadRequestException);

      expect(mockAuthService.hashPassword).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePassword('unknown-id', 'old-pass', 'NewPass123'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
