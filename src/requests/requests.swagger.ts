import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from './entities/request.entity';

export function ApiRequestsController() {
  return applyDecorators(ApiTags('requests'), ApiBearerAuth());
}

export function ApiRequestsPost() {
  return applyDecorators(
    ApiOperation({ summary: 'Создать заявку на обмен навыками' }),
    ApiResponse({
      status: 201,
      description: 'Заявка успешно создана',
      type: Request,
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Навык или пользователь не найден' }),
    ApiResponse({ status: 409, description: 'Конфликт при создании заявки' }),
  );
}

export function ApiRequestsGetIncoming() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить входящие актуальные заявки' }),
    ApiResponse({
      status: 200,
      description: 'Список входящих заявок успешно получен',
      type: [Request],
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}

export function ApiRequestsGetOutgoing() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить исходящие актуальные заявки' }),
    ApiResponse({
      status: 200,
      description: 'Список исходящих заявок успешно получен',
      type: [Request],
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}

export function ApiRequestsPatchRead() {
  return applyDecorators(
    ApiOperation({ summary: 'Отметить заявку прочитанной' }),
    ApiParam({ name: 'id', description: 'UUID заявки' }),
    ApiResponse({
      status: 200,
      description: 'Заявка отмечена прочитанной',
      type: Request,
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Заявка не найдена' }),
    ApiResponse({
      status: 409,
      description: 'Действие доступно только получателю заявки',
    }),
  );
}

export function ApiRequestsPatchAccept() {
  return applyDecorators(
    ApiOperation({ summary: 'Принять заявку' }),
    ApiParam({ name: 'id', description: 'UUID заявки' }),
    ApiResponse({
      status: 200,
      description: 'Заявка успешно принята',
      type: Request,
    }),
    ApiResponse({
      status: 400,
      description: 'Заявка находится в финальном статусе',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Заявка не найдена' }),
    ApiResponse({
      status: 409,
      description: 'Действие доступно только получателю заявки',
    }),
  );
}

export function ApiRequestsPatchReject() {
  return applyDecorators(
    ApiOperation({ summary: 'Отклонить заявку' }),
    ApiParam({ name: 'id', description: 'UUID заявки' }),
    ApiResponse({
      status: 200,
      description: 'Заявка успешно отклонена',
      type: Request,
    }),
    ApiResponse({
      status: 400,
      description: 'Заявка находится в финальном статусе',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Заявка не найдена' }),
    ApiResponse({
      status: 409,
      description: 'Действие доступно только получателю заявки',
    }),
  );
}

export function ApiRequestsDelete() {
  return applyDecorators(
    ApiOperation({ summary: 'Удалить заявку' }),
    ApiParam({ name: 'id', description: 'UUID заявки' }),
    ApiResponse({
      status: 200,
      description: 'Заявка успешно удалена',
      type: Request,
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Недостаточно прав для удаления заявки',
    }),
    ApiResponse({ status: 404, description: 'Заявка не найдена' }),
  );
}
