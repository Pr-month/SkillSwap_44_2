import { Controller, Post, Body, Res, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { Controller, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Response } from 'express';
import ms from 'ms';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  ApiAuthController,
  ApiAuthLogin,
  ApiAuthLogout,
  ApiAuthRefresh,
  ApiAuthRegister,
} from './auth.swagger';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RequestWithUser } from './auth.types';

@ApiAuthController()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiAuthRegister()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.authService.register(createUserDto);
  }

  @ApiAuthLogin()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.authService.login(loginDto);

    const refreshExpiresIn = this.authService.getRefreshTokenExpiresIn();
    const maxAge = ms(refreshExpiresIn);

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge,
    });

    const { refreshToken: _refreshToken, ...responseWithoutRefreshToken } =
      result;
    return responseWithoutRefreshToken;
  }

  @ApiAuthLogout()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: RequestWithUser) {
    return this.authService.logout(req.user.sub);
  }

  @ApiAuthRefresh()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
