import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import { User } from '../users/entities/user.entity';

describe('SkillsService', () => {
  let service: SkillsService;
  let skillsRepository: Record<string, jest.Mock>;
  let usersRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    skillsRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      find: jest.fn(),
    };
    usersRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };
    const mockDataSource = {} as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getRepositoryToken(Skill), useValue: skillsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  // --------------- create ---------------

  describe('create', () => {
    const dto = { title: 'Guitar', description: 'Learn chords', images: ['img.jpg'] };

    it('should create a skill', async () => {
      const owner = { id: 'user-id', name: 'User' } as unknown as User;
      const created = { id: 'skill-id', ...dto, owner } as unknown as Skill;

      usersRepository.findOneBy.mockResolvedValue(owner);
      skillsRepository.create.mockReturnValue(created);
      skillsRepository.save.mockResolvedValue(created);

      const result = await service.create('user-id', dto);

      expect(result).toEqual(created);
      expect(skillsRepository.create).toHaveBeenCalledWith({
        title: dto.title,
        description: dto.description,
        images: dto.images,
        owner,
      });
    });

    it('should create a skill with default empty description', async () => {
      const owner = { id: 'user-id' } as unknown as User;
      const dtoNoDesc = { title: 'Guitar' };
      const created = { id: 'skill-id', title: 'Guitar', description: '' } as unknown as Skill;

      usersRepository.findOneBy.mockResolvedValue(owner);
      skillsRepository.create.mockReturnValue(created);
      skillsRepository.save.mockResolvedValue(created);

      const result = await service.create('user-id', dtoNoDesc);

      expect(result.description).toBe('');
    });

    it('should throw NotFoundException when user not found', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create('unknown', dto)).rejects.toThrow('User not found');
    });
  });

  // --------------- findAll ---------------

  describe('findAll', () => {
    it('should return paginated skills', async () => {
      const skills = [{ id: 's-1' }, { id: 's-2' }] as Skill[];

      skillsRepository.findAndCount.mockResolvedValue([skills, 20]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: skills,
        page: 1,
        limit: 10,
        total: 20,
        totalPages: 2,
      });
    });

    it('should throw NotFoundException when page exceeds total pages', async () => {
      skillsRepository.findAndCount.mockResolvedValue([[], 10]);

      await expect(service.findAll({ page: 5, limit: 10 })).rejects.toThrow('Страница не найдена');
    });

    it('should return empty data when total is 0', async () => {
      skillsRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });
  });

  // --------------- findOne ---------------

  describe('findOne', () => {
    it('should return a skill by id', async () => {
      const skill = { id: 'skill-id', title: 'Guitar' } as Skill;

      skillsRepository.findOne.mockResolvedValue(skill);

      const result = await service.findOne('skill-id');

      expect(result).toEqual(skill);
      expect(skillsRepository.findOne).toHaveBeenCalledWith({ where: { id: 'skill-id' } });
    });

    it('should throw NotFoundException when skill not found', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toThrow('not found');
    });
  });

  // --------------- update ---------------

  describe('update', () => {
    it('should update a skill', async () => {
      const skill = { id: 'skill-id', title: 'Old' } as Skill;

      skillsRepository.findOne.mockResolvedValue(skill);
      skillsRepository.save.mockImplementation(async (s) => s);

      const result = await service.update('skill-id', { title: 'New' });

      expect(result.title).toBe('New');
    });

    it('should throw NotFoundException when skill not found', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.update('unknown', { title: 'New' })).rejects.toThrow('not found');
    });
  });

  // --------------- remove ---------------

  describe('remove', () => {
    it('should delete a skill when user is the owner', async () => {
      const skill = { id: 'skill-id', owner: { id: 'user-id' } } as unknown as Skill;

      skillsRepository.findOne.mockResolvedValue(skill);
      skillsRepository.remove.mockResolvedValue(skill);

      const result = await service.remove('skill-id', 'user-id');

      expect(result).toEqual(skill);
      expect(skillsRepository.remove).toHaveBeenCalledWith(skill);
    });

    it('should throw NotFoundException when skill not found', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown', 'user-id')).rejects.toThrow('Навык не найден');
    });

    it('should throw ForbiddenException when non-owner tries to delete', async () => {
      const skill = { id: 'skill-id', owner: { id: 'owner-id' } } as unknown as Skill;

      skillsRepository.findOne.mockResolvedValue(skill);

      await expect(service.remove('skill-id', 'other-user')).rejects.toThrow('Можно удалить только свой навык');
    });
  });

  // --------------- addToFavorite ---------------

  describe('addToFavorite', () => {
    const skill = { id: 'skill-id', title: 'Guitar' } as Skill;
    const user = { id: 'user-id', favoriteSkills: [] } as unknown as User;

    it('should add skill to favorites', async () => {
      skillsRepository.findOne.mockResolvedValue(skill);
      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(user);

      await service.addToFavorite('user-id', 'skill-id');

      expect(user.favoriteSkills).toContain(skill);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException when skill not found', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.addToFavorite('user-id', 'unknown')).rejects.toThrow('not found');
    });

    it('should throw NotFoundException when user not found', async () => {
      skillsRepository.findOne.mockResolvedValue(skill);
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.addToFavorite('unknown', 'skill-id')).rejects.toThrow('User not found');
    });

    it('should throw ConflictException when skill already in favorites', async () => {
      const userWithFav = { id: 'user-id', favoriteSkills: [skill] } as unknown as User;

      skillsRepository.findOne.mockResolvedValue(skill);
      usersRepository.findOne.mockResolvedValue(userWithFav);

      await expect(service.addToFavorite('user-id', 'skill-id')).rejects.toThrow('already in favorites');
    });
  });

  // --------------- removeFromFavorites ---------------

  describe('removeFromFavorites', () => {
    const skill = { id: 'skill-id', title: 'Guitar' } as Skill;
    const user = { id: 'user-id', favoriteSkills: [skill] } as unknown as User;

    it('should remove skill from favorites and return user', async () => {
      skillsRepository.findOne.mockResolvedValue(skill);
      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockImplementation(async (u) => u);

      const result = await service.removeFromFavorites('skill-id', 'user-id');

      expect(user.favoriteSkills).toEqual([]);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when skill not found', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFromFavorites('unknown', 'user-id')).rejects.toThrow('Навык не найден');
    });

    it('should throw NotFoundException when user not found', async () => {
      skillsRepository.findOne.mockResolvedValue(skill);
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFromFavorites('skill-id', 'unknown')).rejects.toThrow('Пользователь не найден');
    });

    it('should not fail when skill is not in favorites (filter handles missing)', async () => {
      const userWithout = { id: 'user-id', favoriteSkills: [] } as unknown as User;

      skillsRepository.findOne.mockResolvedValue(skill);
      usersRepository.findOne.mockResolvedValue(userWithout);
      usersRepository.save.mockImplementation(async (u) => u);

      const result = await service.removeFromFavorites('skill-id', 'user-id');

      expect(result.favoriteSkills).toEqual([]);
    });
  });

  // --------------- removeFromFavorite ---------------

  describe('removeFromFavorite', () => {
    const skill = { id: 'skill-id', title: 'Guitar' } as Skill;
    const user = { id: 'user-id', favoriteSkills: [skill] } as unknown as User;

    it('should remove skill from favorites using splice', async () => {
      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(user);

      await service.removeFromFavorite('user-id', 'skill-id');

      expect(user.favoriteSkills).toEqual([]);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFromFavorite('unknown', 'skill-id')).rejects.toThrow('User not found');
    });

    it('should throw NotFoundException when skill not in favorites', async () => {
      const userWithout = { id: 'user-id', favoriteSkills: [] } as unknown as User;

      usersRepository.findOne.mockResolvedValue(userWithout);

      await expect(service.removeFromFavorite('user-id', 'skill-id')).rejects.toThrow('is not in favorites');
    });
  });

  // --------------- findSimilar ---------------

  describe('findSimilar', () => {
    it('should return users with skills in same category', async () => {
      const skill = { id: 'skill-id', category: { id: 'cat-1' } } as unknown as Skill;
      const users = [{ id: 'u-1' }, { id: 'u-2' }] as unknown as User[];

      skillsRepository.findOne.mockResolvedValue(skill);
      usersRepository.find.mockResolvedValue(users);

      const result = await service.findSimilar('skill-id');

      expect(result).toEqual(users);
      expect(usersRepository.find).toHaveBeenCalledWith({
        relations: { skills: true },
        where: { skills: { category: { id: 'cat-1' } } },
        take: 10,
      });
    });

    it('should return empty array when skill not found', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      const result = await service.findSimilar('unknown');

      expect(result).toEqual([]);
    });

    it('should return empty array when skill has no category', async () => {
      const skill = { id: 'skill-id', category: null } as unknown as Skill;

      skillsRepository.findOne.mockResolvedValue(skill);

      const result = await service.findSimilar('skill-id');

      expect(result).toEqual([]);
    });
  });
});