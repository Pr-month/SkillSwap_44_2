import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestWithUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Получить список пользователей' })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей успешно получен',
    type: [User],
  })
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить данные текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Данные текущего пользователя успешно получены',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: RequestWithUser): Promise<User> {
    return this.usersService.findOne(req.user.sub);
  }

  @ApiOperation({ summary: 'Получить пользователя по id' })
  @ApiParam({ name: 'id', description: 'UUID пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно найден',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить данные текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Данные пользователя успешно обновлены',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(req.user.sub, updateUserDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить пароль текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Пароль успешно изменён',
    schema: {
      example: {
        message: 'Password successfully changed',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Некорректный новый пароль' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Старый пароль указан неверно' })
  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async updatePassword(
    @Req() req: RequestWithUser,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.updatePassword(
      req.user.sub,
      updatePasswordDto.oldPassword,
      updatePasswordDto.newPassword,
    );

    return { message: 'Password successfully changed' };
  }

  // Удалить если не будем делать удаление пользователя
  // Если будем, закрыть гардой с админкой
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(id);
  // }
}
