import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RequestWithUser } from 'src/auth/auth.types';
import { Request } from './entities/request.entity';

@ApiTags('requests')
@ApiBearerAuth()
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiOperation({ summary: 'Создать заявку на обмен навыками' })
  @ApiResponse({
    status: 201,
    description: 'Заявка успешно создана',
    type: Request,
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Навык или пользователь не найден' })
  @ApiResponse({ status: 409, description: 'Конфликт при создании заявки' })
  @Post()
  create(
    @Body() createRequestDto: CreateRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<Request> {
    const senderId = req.user.sub;
    return this.requestsService.create(createRequestDto, senderId);
  }

  @ApiOperation({ summary: 'Получить входящие актуальные заявки' })
  @ApiResponse({
    status: 200,
    description: 'Список входящих заявок успешно получен',
    type: [Request],
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @Get('incoming')
  getIncoming(@Req() req: RequestWithUser): Promise<Request[]> {
    return this.requestsService.findIncoming(req.user.sub);
  }

  @ApiOperation({ summary: 'Получить исходящие актуальные заявки' })
  @ApiResponse({
    status: 200,
    description: 'Список исходящих заявок успешно получен',
    type: [Request],
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @Get('outgoing')
  findOutgoing(@Req() req: RequestWithUser): Promise<Request[]> {
    return this.requestsService.findOutgoing(req.user.sub);
  }

  @ApiOperation({ summary: 'Отметить заявку прочитанной' })
  @ApiParam({ name: 'id', description: 'UUID заявки' })
  @ApiResponse({
    status: 200,
    description: 'Заявка отмечена прочитанной',
    type: Request,
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  @ApiResponse({
    status: 409,
    description: 'Действие доступно только получателю заявки',
  })
  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Request> {
    const userId = req.user.sub;
    return this.requestsService.markAsRead(id, userId);
  }

  @ApiOperation({ summary: 'Принять заявку' })
  @ApiParam({ name: 'id', description: 'UUID заявки' })
  @ApiResponse({
    status: 200,
    description: 'Заявка успешно принята',
    type: Request,
  })
  @ApiResponse({
    status: 400,
    description: 'Заявка находится в финальном статусе',
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  @ApiResponse({
    status: 409,
    description: 'Действие доступно только получателю заявки',
  })
  @Patch(':id/accept')
  accept(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Request> {
    const userId = req.user.sub;
    return this.requestsService.acceptRequest(id, userId);
  }

  @ApiOperation({ summary: 'Отклонить заявку' })
  @ApiParam({ name: 'id', description: 'UUID заявки' })
  @ApiResponse({
    status: 200,
    description: 'Заявка успешно отклонена',
    type: Request,
  })
  @ApiResponse({
    status: 400,
    description: 'Заявка находится в финальном статусе',
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  @ApiResponse({
    status: 409,
    description: 'Действие доступно только получателю заявки',
  })
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Request> {
    const userId = req.user.sub;
    return this.requestsService.rejectRequest(id, userId);
  }

  @ApiOperation({ summary: 'Удалить заявку' })
  @ApiParam({ name: 'id', description: 'UUID заявки' })
  @ApiResponse({
    status: 200,
    description: 'Заявка успешно удалена',
    type: Request,
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав для удаления заявки',
  })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Request> {
    return this.requestsService.remove(id, req.user.sub, req.user.role);
  }
}
