import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { RequestWithUser } from '../auth/auth.types';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' },
      ];

      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const user = { id: 'user-id', name: 'Current user' };
      const req = { user: { sub: 'user-id' } } as RequestWithUser;

      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.getMe(req);

      expect(result).toEqual(user);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-id');
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      const user = { id: 'user-id', name: 'User' };

      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.findOne('user-id');

      expect(result).toEqual(user);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-id');
    });
  });

  describe('updateMe', () => {
    it('should update current user', async () => {
      const dto = { name: 'Updated name' };
      const updated = { id: 'user-id', name: 'Updated name' };
      const req = { user: { sub: 'user-id' } } as RequestWithUser;

      mockUsersService.update.mockResolvedValue(updated);

      const result = await controller.updateMe(req, dto as any);

      expect(result).toEqual(updated);
      expect(mockUsersService.update).toHaveBeenCalledWith('user-id', dto);
    });
  });

  describe('updatePassword', () => {
    it('should change password and return success message', async () => {
      const dto: UpdatePasswordDto = {
        oldPassword: 'OldPass1',
        newPassword: 'NewPass123',
      };
      const req = { user: { sub: 'user-id' } } as RequestWithUser;

      mockUsersService.updatePassword.mockResolvedValue(undefined);

      const result = await controller.updatePassword(req, dto);

      expect(result).toEqual({ message: 'Password successfully changed' });
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        'user-id',
        'OldPass1',
        'NewPass123',
      );
    });
  });
});
