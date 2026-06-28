import { Controller, Get, Post, Body, Req, Patch, Param } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestWithUser } from '../auth/auth.types';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(
    @Body() createRequestDto: CreateRequestDto,
    @Req() req: RequestWithUser,
  ) {
    const senderId = req.user.sub;
    return this.requestsService.create(createRequestDto, senderId);
  }

  // @Get()
  // findAll() {
  //   return this.requestsService.findAll();
  // }

  @Get('incoming')
  getIncoming(@Req() req: RequestWithUser) {
    return this.requestsService.findIncoming(req.user.sub);
  }

  @Get('outgoing')
  findOutgoing(@Req() req: RequestWithUser) {
    return this.requestsService.findOutgoing(req.user.sub);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.requestsService.findOne(+id);
  // }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.sub;
    return this.requestsService.markAsRead(id, userId);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.sub;
    return this.requestsService.acceptRequest(id, userId);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.sub;
    return this.requestsService.rejectRequest(id, userId);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.requestsService.remove(+id);
  // }
}
