import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from '../users/entities/user.entity';

export function ApiAuthController() {
  return applyDecorators(ApiTags('auth'));
}

export function ApiAuthRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Зарегистрировать пользователя' }),
    ApiResponse({
      status: 201,
      description: 'Пользователь успешно зарегистрирован',
      type: User,
    }),
    ApiResponse({ status: 400, description: 'Некорректные данные' }),
    ApiResponse({
      status: 409,
      description: 'Пользователь с таким email уже существует',
    }),
  );
}

export function ApiAuthLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Войти в аккаунт' }),
    ApiResponse({
      status: 201,
      description: 'Авторизация прошла успешно',
      type: LoginResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Некорректные данные' }),
    ApiResponse({ status: 401, description: 'Неверный email или пароль' }),
  );
}

export function ApiAuthLogout() {
  return applyDecorators(
    ApiOperation({ summary: 'Выйти из аккаунта' }),
    ApiParam({ name: 'id', description: 'UUID пользователя' }),
    ApiResponse({
      status: 201,
      description: 'Пользователь успешно вышел из аккаунта',
    }),
    ApiResponse({ status: 404, description: 'Пользователь не найден' }),
  );
}

export function ApiAuthRefresh() {
  return applyDecorators(
    ApiOperation({ summary: 'Обновить access и refresh токены' }),
    ApiResponse({
      status: 201,
      description: 'Токены успешно обновлены',
      type: LoginResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Refresh token недействителен' }),
  );
}
