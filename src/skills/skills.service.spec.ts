import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import { User } from '../users/entities/user.entity';

describe('SkillsService', () => {
  let service: SkillsService;
  let skillsRepository: {
    findOne: jest.Mock;
    remove: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findAndCount: jest.Mock;
  };
  let usersRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    skillsRepository = {
      findOne: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
    };
    usersRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: getRepositoryToken(Skill),
          useValue: skillsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('removes a skill from favorites for current user', async () => {
    const skill = { id: 'skill-id' } as Skill;
    const user = { id: 'user-id', favoriteSkills: [skill] } as User;

    skillsRepository.findOne.mockResolvedValue(skill);
    usersRepository.findOne.mockResolvedValue(user);
    usersRepository.save.mockResolvedValue(user);

    const result = await service.removeFromFavorites('skill-id', 'user-id');

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      relations: { favoriteSkills: true },
    });
    expect(user.favoriteSkills).toEqual([]);
    expect(usersRepository.save).toHaveBeenCalledWith(user);
    expect(result).toEqual(user);
  });
});
