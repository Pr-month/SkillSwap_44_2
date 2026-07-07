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
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequestWithUser } from '../auth/auth.types';
import { Request } from './entities/request.entity';
import {
  ApiRequestsController,
  ApiRequestsDelete,
  ApiRequestsGetIncoming,
  ApiRequestsGetOutgoing,
  ApiRequestsPatchAccept,
  ApiRequestsPatchRead,
  ApiRequestsPatchReject,
  ApiRequestsPost,
} from './requests.swagger';

@ApiRequestsController()
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiRequestsPost()
  @Post()
  create(
    @Body() createRequestDto: CreateRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<Request> {
    const senderId = req.user.sub;
    return this.requestsService.create(createRequestDto, senderId);
  }

  @ApiRequestsGetIncoming()
  @Get('incoming')
  getIncoming(@Req() req: RequestWithUser): Promise<Request[]> {
    return this.requestsService.findIncoming(req.user.sub);
  }

  @ApiRequestsGetOutgoing()
  @Get('outgoing')
  findOutgoing(@Req() req: RequestWithUser): Promise<Request[]> {
    return this.requestsService.findOutgoing(req.user.sub);
  }

  @ApiRequestsPatchRead()
  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Request> {
    const userId = req.user.sub;
    return this.requestsService.markAsRead(id, userId);
  }

  @ApiRequestsPatchAccept()
  @Patch(':id/accept')
  accept(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Request> {
    const userId = req.user.sub;
    return this.requestsService.acceptRequest(id, userId);
  }

  @ApiRequestsPatchReject()
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Request> {
    const userId = req.user.sub;
    return this.requestsService.rejectRequest(id, userId);
  }

  @ApiRequestsDelete()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Request> {
    return this.requestsService.remove(id, req.user.sub, req.user.role);
  }
}
