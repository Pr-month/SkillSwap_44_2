import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { expect } from '@jest/globals';

import { RequestsService } from './requests.service';
import { Request } from './entities/request.entity';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { RequestStatus } from './enums/requests.enums';
import { UserRole } from '../users/enums/users.enums';

describe('RequestsService', () => {
  let service: RequestsService;
  let mockRequestsRepository: Record<string, jest.Mock>;
  let mockSkillsRepository: Record<string, jest.Mock>;
  let mockUsersRepository: Record<string, jest.Mock>;
  let mockNotificationsGateway: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRequestsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    mockSkillsRepository = { findOne: jest.fn() };
    mockUsersRepository = { findOne: jest.fn(), save: jest.fn() };
    mockNotificationsGateway = { notifyUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(Request),
          useValue: mockRequestsRepository,
        },
        { provide: getRepositoryToken(Skill), useValue: mockSkillsRepository },
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  describe('findIncoming', () => {
    it('should return incoming requests with active statuses', async () => {
      const requests = [{ id: 'r-1' }, { id: 'r-2' }] as Request[];
      mockRequestsRepository.find.mockResolvedValue(requests);
      const result = await service.findIncoming('user-id');
      expect(result).toEqual(requests);
      expect(mockRequestsRepository.find).toHaveBeenCalledWith({
        where: { receiver: { id: 'user-id' }, status: expect.any(Object) },
        relations: {
          sender: true,
          receiver: true,
          offeredSkill: true,
          requestedSkill: true,
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOutgoing', () => {
    it('should return outgoing requests with active statuses', async () => {
      const requests = [{ id: 'r-1' }] as Request[];
      mockRequestsRepository.find.mockResolvedValue(requests);
      const result = await service.findOutgoing('user-id');
      expect(result).toEqual(requests);
      expect(mockRequestsRepository.find).toHaveBeenCalledWith({
        where: { sender: { id: 'user-id' }, status: expect.any(Object) },
        relations: {
          sender: true,
          receiver: true,
          offeredSkill: true,
          requestedSkill: true,
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    const dto = { offeredSkillId: 'skill-1', requestedSkillId: 'skill-2' };

    it('should create a request and send notification', async () => {
      const owner = { id: 'receiver-id', name: 'Receiver' } as unknown as User;
      const offeredSkill = {
        id: 'skill-1',
        title: 'Guitar',
        owner,
      } as unknown as Skill;
      const requestedSkill = {
        id: 'skill-2',
        title: 'Piano',
        owner,
      } as unknown as Skill;
      const savedRequest = {
        id: 'req-1',
        status: RequestStatus.PENDING,
      } as Request;

      mockSkillsRepository.findOne
        .mockResolvedValueOnce(offeredSkill)
        .mockResolvedValueOnce(requestedSkill);
      mockUsersRepository.findOne.mockResolvedValue({
        id: 'sender-id',
        name: 'Sender',
      });
      mockRequestsRepository.create.mockReturnValue(savedRequest);
      mockRequestsRepository.save.mockResolvedValue(savedRequest);

      const result = await service.create(dto, 'sender-id');

      expect(result).toEqual(savedRequest);
      expect(mockRequestsRepository.create).toHaveBeenCalledWith({
        sender: { id: 'sender-id', name: 'Sender' },
        receiver: owner,
        offeredSkill,
        requestedSkill,
        status: RequestStatus.PENDING,
        isRead: false,
      });
      expect(mockNotificationsGateway.notifyUser).toHaveBeenCalledWith(
        'receiver-id',
        expect.objectContaining({ type: 'new_request' }),
      );
    });

    it('should throw NotFoundException when offeredSkill not found', async () => {
      mockSkillsRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.create(dto, 'sender-id')).rejects.toThrow(
        'Offered skill',
      );
    });

    it('should throw NotFoundException when requestedSkill not found', async () => {
      mockSkillsRepository.findOne
        .mockResolvedValueOnce({
          id: 'skill-1',
          owner: { id: 'owner-id' },
        })
        .mockResolvedValueOnce(null);
      await expect(service.create(dto, 'sender-id')).rejects.toThrow(
        'Requested skill',
      );
    });

    it('should throw ConflictException when requestedSkill has no owner', async () => {
      mockSkillsRepository.findOne
        .mockResolvedValueOnce({
          id: 'skill-1',
          owner: { id: 'owner-id' },
        })
        .mockResolvedValueOnce({
          id: 'skill-2',
          owner: undefined,
        });
      await expect(service.create(dto, 'sender-id')).rejects.toThrow(
        'does not have an owner',
      );
    });

    it('should throw ConflictException when sender tries to create request to self', async () => {
      const owner = { id: 'same-id' } as unknown as User;
      mockSkillsRepository.findOne
        .mockResolvedValueOnce({ id: 'skill-1', owner })
        .mockResolvedValueOnce({ id: 'skill-2', owner });
      await expect(service.create(dto, 'same-id')).rejects.toThrow(
        'Cannot create a request to yourself',
      );
    });

    it('should throw NotFoundException when sender user not found', async () => {
      mockSkillsRepository.findOne
        .mockResolvedValueOnce({
          id: 'skill-1',
          owner: { id: 'receiver-id' },
        })
        .mockResolvedValueOnce({
          id: 'skill-2',
          owner: { id: 'receiver-id' },
        });
      mockUsersRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.create(dto, 'sender-id')).rejects.toThrow(
        'Sender user not found',
      );
    });

    it('should throw NotFoundException when receiver user not found (string owner)', async () => {
      mockSkillsRepository.findOne
        .mockResolvedValueOnce({ id: 'skill-1' })
        .mockResolvedValueOnce({
          id: 'skill-2',
          owner: 'receiver-id',
        });
      mockUsersRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.create(dto, 'sender-id')).rejects.toThrow(
        'Receiver user not found',
      );
    });
  });

  describe('acceptRequest', () => {
    const sender = { id: 'sender-id', name: 'Sender' } as unknown as User;
    const receiver = { id: 'receiver-id', name: 'Receiver' } as unknown as User;
    const offeredSkill = { id: 'skill-1', title: 'Guitar' } as unknown as Skill;
    const requestedSkill = {
      id: 'skill-2',
      title: 'Piano',
    } as unknown as Skill;

    const buildRequest = (status: RequestStatus) =>
      ({
        id: 'req-1',
        status,
        sender,
        receiver,
        offeredSkill,
        requestedSkill,
      }) as Request;

    it('should accept request, exchange skills, send notification', async () => {
      const request = buildRequest(RequestStatus.PENDING);
      mockRequestsRepository.findOne.mockResolvedValue(request);
      mockUsersRepository.findOne
        .mockResolvedValueOnce({ ...sender, skills: [] })
        .mockResolvedValueOnce({ ...receiver, skills: [] });

      mockRequestsRepository.save.mockResolvedValue(request);

      const result = await service.acceptRequest('req-1', 'receiver-id');

      expect(result.status).toBe(RequestStatus.ACCEPTED);
      expect(mockUsersRepository.save).toHaveBeenCalled();
      expect(mockNotificationsGateway.notifyUser).toHaveBeenCalledWith(
        'sender-id',
        expect.objectContaining({ type: 'request_accepted' }),
      );
    });

    it('should not duplicate already owned skills during exchange', async () => {
      mockRequestsRepository.findOne.mockResolvedValue(
        buildRequest(RequestStatus.PENDING),
      );
      mockUsersRepository.findOne
        .mockResolvedValueOnce({ ...sender, skills: [requestedSkill] })
        .mockResolvedValueOnce({ ...receiver, skills: [offeredSkill] });
      const request = buildRequest(RequestStatus.PENDING);
      mockRequestsRepository.findOne.mockResolvedValue(request);
      mockRequestsRepository.save.mockResolvedValue(request);

      const result = await service.acceptRequest('req-1', 'receiver-id');

      expect(result.status).toBe(RequestStatus.ACCEPTED);
    });

    it('should throw NotFoundException when request not found', async () => {
      mockRequestsRepository.findOne.mockResolvedValue(null);
      await expect(service.acceptRequest('unknown', 'user-id')).rejects.toThrow(
        'not found',
      );
    });

    it('should throw ConflictException when user is not the receiver', async () => {
      mockRequestsRepository.findOne.mockResolvedValue(
        buildRequest(RequestStatus.PENDING),
      );
      await expect(
        service.acceptRequest('req-1', 'wrong-user'),
      ).rejects.toThrow('Only the receiver');
    });

    it('should throw BadRequestException when status is REJECTED', async () => {
      mockRequestsRepository.findOne.mockResolvedValue(
        buildRequest(RequestStatus.REJECTED),
      );
      await expect(
        service.acceptRequest('req-1', 'receiver-id'),
      ).rejects.toThrow('final status');
    });

    it('should throw BadRequestException when status is DONE', async () => {
      mockRequestsRepository.findOne.mockResolvedValue(
        buildRequest(RequestStatus.DONE),
      );
      await expect(
        service.acceptRequest('req-1', 'receiver-id'),
      ).rejects.toThrow('final status');
    });
  });

  describe('rejectRequest', () => {
    const sender = { id: 'sender-id' } as unknown as User;
    const receiver = { id: 'receiver-id' } as unknown as User;
    const offeredSkill = { title: 'Guitar' } as unknown as Skill;

    it('should reject request and send notification', async () => {
      const request = {
        id: 'req-1',
        status: RequestStatus.PENDING,
        sender,
        receiver,
        offeredSkill,
      } as Request;

      mockRequestsRepository.findOne.mockResolvedValue(request);

      // ✅
      mockRequestsRepository.save.mockResolvedValue(request);

      const result = await service.rejectRequest('req-1', 'receiver-id');

      expect(result.status).toBe(RequestStatus.REJECTED);
      expect(mockNotificationsGateway.notifyUser).toHaveBeenCalledWith(
        'sender-id',
        expect.objectContaining({ type: 'request_rejected' }),
      );
    });

    it('should throw NotFoundException when request not found', async () => {
      mockRequestsRepository.findOne.mockResolvedValue(null);
      await expect(service.rejectRequest('unknown', 'user-id')).rejects.toThrow(
        'not found',
      );
    });

    it('should throw ConflictException when user is not the receiver', async () => {
      const request = {
        id: 'req-1',
        status: RequestStatus.PENDING,
        sender,
        receiver,
      } as Request;
      mockRequestsRepository.findOne.mockResolvedValue(request);
      await expect(
        service.rejectRequest('req-1', 'wrong-user'),
      ).rejects.toThrow('Only the receiver');
    });

    it('should throw BadRequestException when status is final', async () => {
      const request = {
        id: 'req-1',
        status: RequestStatus.DONE,
        sender,
        receiver,
      } as Request;
      mockRequestsRepository.findOne.mockResolvedValue(request);
      await expect(
        service.rejectRequest('req-1', 'receiver-id'),
      ).rejects.toThrow('final status');
    });
  });

  describe('markAsRead', () => {
    const sender = { id: 'sender-id' } as unknown as User;
    const receiver = { id: 'receiver-id' } as unknown as User;

    it('should mark request as read', async () => {
      const request = {
        id: 'req-1',
        isRead: false,
        status: RequestStatus.PENDING,
        sender,
        receiver,
      } as Request;

      mockRequestsRepository.findOne.mockResolvedValue(request);

      // ✅
      mockRequestsRepository.save.mockResolvedValue({
        ...request,
        isRead: true,
      });

      const result = await service.markAsRead('req-1', 'receiver-id');
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException when request not found', async () => {
      mockRequestsRepository.findOne.mockResolvedValue(null);
      await expect(service.markAsRead('unknown', 'user-id')).rejects.toThrow(
        'not found',
      );
    });

    it('should throw ConflictException when user is not the receiver', async () => {
      const request = { id: 'req-1', sender, receiver } as Request;
      mockRequestsRepository.findOne.mockResolvedValue(request);
      await expect(service.markAsRead('req-1', 'wrong-user')).rejects.toThrow(
        'Only the receiver',
      );
    });
  });

  describe('remove', () => {
    it('should delete request when sender is the owner', async () => {
      const request = { id: 'req-1', sender: { id: 'sender-id' } } as Request;
      mockRequestsRepository.findOne.mockResolvedValue(request);
      mockRequestsRepository.remove.mockResolvedValue(request);
      const result = await service.remove('req-1', 'sender-id', UserRole.USER);
      expect(result).toEqual(request);
      expect(mockRequestsRepository.remove).toHaveBeenCalledWith(request);
    });

    it('should delete request when user is admin', async () => {
      const request = { id: 'req-1', sender: { id: 'other-id' } } as Request;
      mockRequestsRepository.findOne.mockResolvedValue(request);
      mockRequestsRepository.remove.mockResolvedValue(request);
      const result = await service.remove('req-1', 'admin-id', UserRole.ADMIN);
      expect(result).toEqual(request);
    });

    it('should throw NotFoundException when request not found', async () => {
      mockRequestsRepository.findOne.mockResolvedValue(null);
      await expect(
        service.remove('unknown', 'user-id', UserRole.USER),
      ).rejects.toThrow('Запрос не найден');
    });

    it('should throw ForbiddenException when non-admin tries to delete another request', async () => {
      const request = { id: 'req-1', sender: { id: 'owner-id' } } as Request;
      mockRequestsRepository.findOne.mockResolvedValue(request);
      await expect(
        service.remove('req-1', 'other-user', UserRole.USER),
      ).rejects.toThrow('не можете удалить');
    });
  });
});
