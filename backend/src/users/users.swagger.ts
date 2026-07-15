import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from './entities/user.entity';

export function ApiUsersController() {
  return applyDecorators(ApiTags('users'));
}

export function ApiUsersGetAll() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить список пользователей' }),
    ApiResponse({
      status: 200,
      description: 'Список пользователей успешно получен',
      type: [User],
    }),
  );
}

export function ApiUsersGetMe() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Получить данные текущего пользователя' }),
    ApiResponse({
      status: 200,
      description: 'Данные текущего пользователя успешно получены',
      type: User,
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}

export function ApiUsersGetOne() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить пользователя по id' }),
    ApiParam({ name: 'id', description: 'UUID пользователя' }),
    ApiResponse({
      status: 200,
      description: 'Пользователь успешно найден',
      type: User,
    }),
    ApiResponse({ status: 404, description: 'Пользователь не найден' }),
  );
}

export function ApiUsersPatchMe() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Обновить данные текущего пользователя' }),
    ApiResponse({
      status: 200,
      description: 'Данные пользователя успешно обновлены',
      type: User,
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}

export function ApiUsersPatchPassword() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Обновить пароль текущего пользователя' }),
    ApiResponse({
      status: 200,
      description: 'Пароль успешно изменён',
      schema: {
        example: {
          message: 'Password successfully changed',
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Некорректный новый пароль' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 403, description: 'Старый пароль указан неверно' }),
  );
}
