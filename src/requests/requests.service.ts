import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { Request } from './entities/request.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RequestStatus } from './enums/requests.enums';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/users.enums';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // ---- вспомогательные методы ----
  private async getRequestForReceiver(
    requestId: string,
    userId: string,
  ): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: {
        receiver: true,
        sender: true,
        offeredSkill: true,
        requestedSkill: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Request with id ${requestId} not found`);
    }

    if (!request.receiver || request.receiver.id !== userId) {
      throw new ConflictException('Only the receiver can perform this action');
    }

    return request;
  }

  private assertNotFinalStatus(status: RequestStatus): void {
    if (status === RequestStatus.REJECTED || status === RequestStatus.DONE) {
      throw new BadRequestException(
        'Cannot perform action on a request with a final status',
      );
    }
  }

  // ---- публичные методы для получения заявок ----
  findIncoming(userId: string): Promise<Request[]> {
    return this.requestsRepository.find({
      where: {
        receiver: { id: userId },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: {
        sender: true,
        receiver: true,
        offeredSkill: true,
        requestedSkill: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  findOutgoing(userId: string): Promise<Request[]> {
    return this.requestsRepository.find({
      where: {
        sender: { id: userId },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: {
        sender: true,
        receiver: true,
        offeredSkill: true,
        requestedSkill: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  // ---- CREATE с уведомлением ----
  async create(
    createRequestDto: CreateRequestDto,
    senderId: string,
  ): Promise<Request> {
    const { offeredSkillId, requestedSkillId } = createRequestDto;

    const [offeredSkill, requestedSkill] = await Promise.all([
      this.skillsRepository.findOne({
        where: { id: offeredSkillId },
        relations: ['owner'],
      }),
      this.skillsRepository.findOne({
        where: { id: requestedSkillId },
        relations: ['owner'],
      }),
    ]);

    if (!offeredSkill) {
      throw new NotFoundException(
        `Offered skill with id ${offeredSkillId} not found`,
      );
    }
    if (!requestedSkill) {
      throw new NotFoundException(
        `Requested skill with id ${requestedSkillId} not found`,
      );
    }

    const receiverCandidate = requestedSkill.owner;
    if (!receiverCandidate) {
      throw new ConflictException('Requested skill does not have an owner');
    }

    let receiverUser: User | null;
    if (typeof receiverCandidate === 'string') {
      receiverUser = await this.usersRepository.findOne({
        where: { id: receiverCandidate },
      });
      if (!receiverUser) {
        throw new NotFoundException('Receiver user not found');
      }
    } else {
      receiverUser = receiverCandidate;
    }

    if (senderId === receiverUser.id) {
      throw new ConflictException('Cannot create a request to yourself');
    }

    const senderUser = await this.usersRepository.findOne({
      where: { id: senderId },
    });
    if (!senderUser) {
      throw new NotFoundException('Sender user not found');
    }

    const newRequest = this.requestsRepository.create({
      sender: senderUser,
      receiver: receiverUser,
      offeredSkill,
      requestedSkill,
      status: RequestStatus.PENDING,
      isRead: false,
    });

    const savedRequest = await this.requestsRepository.save(newRequest);

    // Уведомление получателю
    this.notificationsGateway.notifyUser(receiverUser.id, {
      type: 'new_request',
      message: `Новая заявка от ${senderUser.name}`,
      senderName: senderUser.name,
      skillTitle: offeredSkill.title,
      requestId: savedRequest.id,
    });

    return savedRequest;
  }

  // ---- ACCEPT с обменом навыками и уведомлением ----
  async acceptRequest(requestId: string, userId: string): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: {
        sender: true,
        receiver: true,
        offeredSkill: true,
        requestedSkill: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Request with id ${requestId} not found`);
    }
    if (!request.receiver || request.receiver.id !== userId) {
      throw new ConflictException('Only the receiver can accept this request');
    }
    this.assertNotFinalStatus(request.status);

    // Загружаем полные данные пользователей с их навыками
    const [sender, receiver] = await Promise.all([
      this.usersRepository.findOne({
        where: { id: request.sender.id },
        relations: ['skills'],
      }),
      this.usersRepository.findOne({
        where: { id: request.receiver.id },
        relations: ['skills'],
      }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('Sender or receiver not found');
    }

    const offeredSkill = request.offeredSkill;
    const requestedSkill = request.requestedSkill;

    // Обмен навыками
    if (!sender.skills.some((s) => s.id === requestedSkill.id)) {
      sender.skills.push(requestedSkill);
    }
    if (!receiver.skills.some((s) => s.id === offeredSkill.id)) {
      receiver.skills.push(offeredSkill);
    }

    await this.usersRepository.save([sender, receiver]);

    // Обновляем статус заявки
    request.status = RequestStatus.ACCEPTED;
    const updatedRequest = await this.requestsRepository.save(request);

    // Уведомление отправителю
    this.notificationsGateway.notifyUser(sender.id, {
      type: 'request_accepted',
      message: `Ваша заявка на навык "${offeredSkill.title}" принята`,
      skillTitle: offeredSkill.title,
      requestId: updatedRequest.id,
    });

    return updatedRequest;
  }

  // ---- REJECT с уведомлением ----
  async rejectRequest(requestId: string, userId: string): Promise<Request> {
    const request = await this.getRequestForReceiver(requestId, userId);
    this.assertNotFinalStatus(request.status);

    request.status = RequestStatus.REJECTED;
    const updatedRequest = await this.requestsRepository.save(request);

    this.notificationsGateway.notifyUser(request.sender.id, {
      type: 'request_rejected',
      message: `Ваша заявка на навык "${request.offeredSkill.title}" отклонена`,
      skillTitle: request.offeredSkill.title,
      requestId: updatedRequest.id,
    });

    return updatedRequest;
  }

  // ---- остальные методы (markAsRead, remove) ----
  async markAsRead(requestId: string, userId: string): Promise<Request> {
    const request = await this.getRequestForReceiver(requestId, userId);
    request.isRead = true;
    return this.requestsRepository.save(request);
  }

  async remove(id: string, userId: string, role: UserRole): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: { sender: true },
    });

    if (!request) {
      throw new NotFoundException('Запрос не найден');
    }

    if (request.sender.id !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Вы не можете удалить этот запрос');
    }

    await this.requestsRepository.remove(request);
    return request;
  }
}
