import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequestWithUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import {
  ApiUsersController,
  ApiUsersGetAll,
  ApiUsersGetMe,
  ApiUsersGetOne,
  ApiUsersPatchMe,
  ApiUsersPatchPassword,
} from './users.swagger';

@ApiUsersController()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiUsersGetAll()
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @ApiUsersGetMe()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: RequestWithUser): Promise<User> {
    return this.usersService.findOne(req.user.sub);
  }

  @ApiUsersGetOne()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @ApiUsersPatchMe()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(req.user.sub, updateUserDto);
  }

  @ApiUsersPatchPassword()
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
