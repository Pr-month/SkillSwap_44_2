import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Skill } from './entities/skill.entity';

export function ApiSkillsController() {
  return applyDecorators(ApiTags('skills'));
}

export function ApiSkillsPost() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Создать навык' }),
    ApiResponse({
      status: 201,
      description: 'Навык успешно создан',
      type: Skill,
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}

export function ApiSkillsGetAll() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить список навыков с пагинацией' }),
    ApiQuery({ name: 'page', required: false, example: 1 }),
    ApiQuery({ name: 'limit', required: false, example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Список навыков успешно получен',
      schema: {
        example: {
          data: [],
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Страница не найдена' }),
  );
}

export function ApiSkillsGetOne() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить навык по id' }),
    ApiParam({ name: 'id', description: 'UUID навыка' }),
    ApiResponse({
      status: 200,
      description: 'Навык успешно найден',
      type: Skill,
    }),
    ApiResponse({ status: 404, description: 'Навык не найден' }),
  );
}

export function ApiSkillsPatch() {
  return applyDecorators(
    ApiOperation({ summary: 'Обновить навык по id' }),
    ApiParam({ name: 'id', description: 'UUID навыка' }),
    ApiResponse({
      status: 200,
      description: 'Навык успешно обновлён',
      type: Skill,
    }),
    ApiResponse({ status: 404, description: 'Навык не найден' }),
  );
}

export function ApiSkillsDelete() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Удалить свой навык по id' }),
    ApiParam({ name: 'id', description: 'UUID навыка' }),
    ApiResponse({
      status: 200,
      description: 'Навык успешно удалён',
      type: Skill,
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 403, description: 'Можно удалить только свой навык' }),
    ApiResponse({ status: 404, description: 'Навык не найден' }),
  );
}

export function ApiSkillsPostFavorite() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Добавить навык в избранное' }),
    ApiParam({ name: 'id', description: 'UUID навыка' }),
    ApiResponse({
      status: 201,
      description: 'Навык добавлен в избранное',
      schema: { example: { message: 'Skill added to favorites' } },
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Навык или пользователь не найден' }),
    ApiResponse({ status: 409, description: 'Навык уже в избранном' }),
  );
}

export function ApiSkillsDeleteFavorite() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Удалить навык из избранного' }),
    ApiParam({ name: 'id', description: 'UUID навыка' }),
    ApiResponse({
      status: 200,
      description: 'Навык удалён из избранного',
      schema: { example: { message: 'Skill removed from favorites' } },
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Навык или пользователь не найден' }),
  );
}
