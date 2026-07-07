import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Category } from './entities/category.entity';

export function ApiCategoriesController() {
  return applyDecorators(ApiTags('categories'));
}

export function ApiCategoriesPost() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Создать категорию' }),
    ApiResponse({
      status: 201,
      description: 'Категория успешно создана',
      type: Category,
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 403, description: 'Недостаточно прав' }),
  );
}

export function ApiCategoriesGetAll() {
  return applyDecorators(
    ApiOperation({
      summary: 'Получить список основных категорий с подкатегориями',
    }),
    ApiResponse({
      status: 200,
      description: 'Список категорий успешно получен',
      type: [Category],
    }),
  );
}

export function ApiCategoriesGetOne() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить категорию по id' }),
    ApiParam({ name: 'id', description: 'UUID категории' }),
    ApiResponse({
      status: 200,
      description: 'Категория успешно найдена',
      type: Category,
    }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}

export function ApiCategoriesPatch() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Обновить категорию' }),
    ApiParam({ name: 'id', description: 'UUID категории' }),
    ApiResponse({
      status: 200,
      description: 'Категория успешно обновлена',
      type: Category,
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 403, description: 'Недостаточно прав' }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}

export function ApiCategoriesDelete() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Удалить категорию' }),
    ApiParam({ name: 'id', description: 'UUID категории' }),
    ApiResponse({ status: 200, description: 'Категория успешно удалена' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 403, description: 'Недостаточно прав' }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}
