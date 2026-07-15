import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import ms from 'ms';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import {
  ApiAuthController,
  ApiAuthLogin,
  ApiAuthLogout,
  ApiAuthRefresh,
  ApiAuthRegister,
} from './auth.swagger';
import { RequestWithUser } from './auth.types';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt.guard';

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
