import { Injectable } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
  ) {}
  create(createRequestDto: CreateRequestDto) {
    return 'This action adds a new request';
  }

  findAll() {
    return `This action returns all requests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} request`;
  }

  update(id: number, updateRequestDto: UpdateRequestDto) {
    return `This action updates a #${id} request`;
  }

  async remove(id: string, userId: string): Promise<Request> {
    const request = await this.requestRepository.findOne({
      where: {
        id,
      },
      relations: {
        sender: true,
      },
    });

    if (!request) {
      throw new Error('Запрос не найден');
    }

    if (request.sender.id !== userId) {
      throw new Error('Вы не можете удалить этот запрос');
    }

    await this.requestRepository.remove(request);

    return request;
  }
}
