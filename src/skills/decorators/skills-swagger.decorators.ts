import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateSkillDto } from '../dto/create-skill.dto';
import { UpdateSkillDto } from '../dto/update-skill.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { SWAGGER_AUTH_SCHEME_NAME } from '../../config/swagger.config';

export function ApiCreateSkill() {
  return applyDecorators(
    ApiOperation({ summary: 'Создать навык' }),
    ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME),
    ApiBody({ type: CreateSkillDto }),
    ApiResponse({
      status: 201,
      description: 'Навык успешно создан',
      schema: {
        example: {
          id: 'skill-123',
          title: 'Guitar lessons',
          description: 'I can teach basic guitar chords',
          images: ['/uploads/guitar.jpg'],
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Некорректные данные в теле запроса' }),
    ApiResponse({ status: 401, description: 'Неавторизованный запрос' }),
  );
}

export function ApiListSkills() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить список навыков (с пагинацией)' }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Номер страницы (начиная с 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Количество элементов на странице',
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Поиск по названию навыка',
      example: 'guitar',
    }),
    ApiResponse({
      status: 200,
      description: 'Список навыков получен успешно',
      schema: {
        example: {
          data: [
            {
              id: 'skill-123',
              title: 'Guitar lessons',
              description: 'I can teach basic guitar chords',
              images: ['/uploads/guitar.jpg'],
            },
          ],
          page: 1,
          limit: 10,
          total: 42,
          totalPages: 5,
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Недопустимые параметры запроса' }),
    ApiResponse({ status: 404, description: 'Страница не найдена' }),
  );
}

export function ApiGetSkillById() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить навык по ID' }),
    ApiParam({
      name: 'id',
      description: 'UUID навыка',
      example: 'skill-123',
    }),
    ApiResponse({
      status: 200,
      description: 'Навык найден',
      schema: {
        example: {
          id: 'skill-123',
          title: 'Guitar lessons',
          description: 'I can teach basic guitar chords',
          images: ['/uploads/guitar.jpg'],
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Навык не найден' }),
  );
}

export function ApiUpdateSkill() {
  return applyDecorators(
    ApiOperation({ summary: 'Частично обновить навык' }),
    ApiParam({
      name: 'id',
      description: 'UUID навыка',
      example: 'skill-123',
    }),
    ApiBody({ type: UpdateSkillDto }),
    ApiResponse({
      status: 200,
      description: 'Навык обновлён',
      schema: {
        example: {
          id: 'skill-123',
          title: 'Updated guitar lessons',
          description: 'Now I teach advanced techniques',
          images: ['/uploads/guitar-new.jpg'],
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Некорректные данные в теле запроса' }),
    ApiResponse({ status: 404, description: 'Навык не найден' }),
  );
}

export function ApiDeleteSkill() {
  return applyDecorators(
    ApiOperation({ summary: 'Удалить навык (только владелец)' }),
    ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME),
    ApiParam({
      name: 'id',
      description: 'UUID навыка',
      example: 'skill-123',
    }),
    ApiResponse({
      status: 200,
      description: 'Навык удалён',
      schema: {
        example: {
          id: 'skill-123',
          title: 'Guitar lessons',
          description: 'I can teach basic guitar chords',
          images: ['/uploads/guitar.jpg'],
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Неавторизованный запрос' }),
    ApiResponse({ status: 403, description: 'Пользователь не является владельцем навыка' }),
    ApiResponse({ status: 404, description: 'Навык не найден' }),
  );
}

export function ApiAddToFavorite() {
  return applyDecorators(
    ApiOperation({ summary: 'Добавить навык в избранное' }),
    ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME),
    ApiParam({
      name: 'id',
      description: 'UUID навыка',
      example: 'skill-123',
    }),
    ApiResponse({
      status: 201,
      description: 'Навык добавлен в избранное',
      schema: { example: { message: 'Skill added to favorites' } },
    }),
    ApiResponse({ status: 401, description: 'Неавторизованный запрос' }),
    ApiResponse({ status: 404, description: 'Навык не найден' }),
    ApiResponse({ status: 409, description: 'Навык уже в избранном' }),
  );
}

export function ApiRemoveFromFavorite() {
  return applyDecorators(
    ApiOperation({ summary: 'Убрать навык из избранного' }),
    ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME),
    ApiParam({
      name: 'id',
      description: 'UUID навыка',
      example: 'skill-123',
    }),
    ApiResponse({
      status: 200,
      description: 'Навык убран из избранного',
      schema: { example: { message: 'Skill removed from favorites' } },
    }),
    ApiResponse({ status: 401, description: 'Неавторизованный запрос' }),
    ApiResponse({ status: 404, description: 'Навык не был в избранном' }),
  );
}
