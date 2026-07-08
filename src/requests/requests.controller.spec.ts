import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { UserRole } from '../users/enums/users.enums';

describe('RequestsController', () => {
  let controller: RequestsController;

  const mockRequestsService = {
    create: jest.fn(),
    findIncoming: jest.fn(),
    findOutgoing: jest.fn(),
    markAsRead: jest.fn(),
    acceptRequest: jest.fn(),
    rejectRequest: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq = (overrides = {}) => ({
    user: { sub: 'user-id', role: UserRole.USER, ...overrides },
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        { provide: RequestsService, useValue: mockRequestsService },
      ],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to service with senderId from req.user.sub', async () => {
      const dto = { offeredSkillId: 's-1', requestedSkillId: 's-2' };
      const created = { id: 'r-1' };

      mockRequestsService.create.mockResolvedValue(created);

      const result = await controller.create(dto, mockReq() as any);

      expect(result).toEqual(created);
      expect(mockRequestsService.create).toHaveBeenCalledWith(dto, 'user-id');
    });
  });

  describe('getIncoming', () => {
    it('should delegate to service with userId from req.user.sub', async () => {
      const requests = [{ id: 'r-1' }];

      mockRequestsService.findIncoming.mockResolvedValue(requests);

      const result = await controller.getIncoming(mockReq() as any);

      expect(result).toEqual(requests);
      expect(mockRequestsService.findIncoming).toHaveBeenCalledWith('user-id');
    });
  });

  describe('findOutgoing', () => {
    it('should delegate to service with userId from req.user.sub', async () => {
      const requests = [{ id: 'r-1' }];

      mockRequestsService.findOutgoing.mockResolvedValue(requests);

      const result = await controller.findOutgoing(mockReq() as any);

      expect(result).toEqual(requests);
      expect(mockRequestsService.findOutgoing).toHaveBeenCalledWith('user-id');
    });
  });

  describe('markAsRead', () => {
    it('should delegate to service with id and userId', async () => {
      const request = { id: 'r-1', isRead: true };

      mockRequestsService.markAsRead.mockResolvedValue(request);

      const result = await controller.markAsRead('r-1', mockReq() as any);

      expect(result).toEqual(request);
      expect(mockRequestsService.markAsRead).toHaveBeenCalledWith('r-1', 'user-id');
    });
  });

  describe('accept', () => {
    it('should delegate to service with id and userId', async () => {
      const request = { id: 'r-1', status: 'accepted' };

      mockRequestsService.acceptRequest.mockResolvedValue(request);

      const result = await controller.accept('r-1', mockReq() as any);

      expect(result).toEqual(request);
      expect(mockRequestsService.acceptRequest).toHaveBeenCalledWith('r-1', 'user-id');
    });
  });

  describe('reject', () => {
    it('should delegate to service with id and userId', async () => {
      const request = { id: 'r-1', status: 'rejected' };

      mockRequestsService.rejectRequest.mockResolvedValue(request);

      const result = await controller.reject('r-1', mockReq() as any);

      expect(result).toEqual(request);
      expect(mockRequestsService.rejectRequest).toHaveBeenCalledWith('r-1', 'user-id');
    });
  });

  describe('remove', () => {
    it('should delegate to service with id, userId and role from JWT', async () => {
      const request = { id: 'r-1' };

      mockRequestsService.remove.mockResolvedValue(request);

      const result = await controller.remove('r-1', mockReq({ role: UserRole.ADMIN }) as any);

      expect(result).toEqual(request);
      expect(mockRequestsService.remove).toHaveBeenCalledWith('r-1', 'user-id', UserRole.ADMIN);
    });
  });
});
