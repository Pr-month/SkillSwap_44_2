import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateCityDto } from '../dto/create-city.dto';
import { UpdateCityDto } from '../dto/update-city.dto';
import { City } from '../entities/city.entity';
import { SWAGGER_AUTH_SCHEME_NAME } from '../../config/swagger.config';

// Группируем все методы в секцию Cities в Swagger
export function ApiCitiesTag() {
  return applyDecorators(ApiTags('Cities'));
}

export function ApiCreateCity() {
  return applyDecorators(
    ApiOperation({ summary: 'Создать город' }),
    ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME),
    ApiBody({ type: CreateCityDto }),
    ApiResponse({
      status: 201,
      description: 'Город успешно создан',
      type: City,
    }),
    ApiResponse({
      status: 409,
      description: 'Город с таким именем уже существует',
    }),
  );
}

export function ApiListCities() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить список городов с фильтрацией' }),
    ApiQuery({
      name: 'name',
      required: false,
      type: String,
      description: 'Фильтр по названию (частичное совпадение)',
      example: 'Мос',
    }),
    ApiQuery({
      name: 'district',
      required: false,
      type: String,
      description: 'Фильтр по району (частичное совпадение)',
      example: 'ЦАО',
    }),
    ApiQuery({
      name: 'subject',
      required: false,
      type: String,
      description: 'Фильтр по субъекту (частичное совпадение)',
      example: 'г. Москва',
    }),
    ApiResponse({
      status: 200,
      description: 'Список городов получен успешно',
      type: [City],
    }),
  );
}

export function ApiGetCityById() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить город по ID' }),
    ApiParam({
      name: 'id',
      required: true,
      type: 'string',
      format: 'uuid',
      description: 'UUID города',
      example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    }),
    ApiResponse({
      status: 200,
      description: 'Город найден',
      type: City,
    }),
    ApiResponse({
      status: 404,
      description: 'Город не найден',
    }),
  );
}

export function ApiUpdateCity() {
  return applyDecorators(
    ApiOperation({ summary: 'Частично обновить город' }),
    ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME),
    ApiParam({
      name: 'id',
      required: true,
      type: 'string',
      format: 'uuid',
      description: 'UUID города',
      example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    }),
    ApiBody({ type: UpdateCityDto }),
    ApiResponse({
      status: 200,
      description: 'Город обновлён',
      type: City,
    }),
    ApiResponse({
      status: 404,
      description: 'Город не найден',
    }),
    ApiResponse({
      status: 409,
      description: 'Конфликт при обновлении (например, дубликат имени)',
    }),
  );
}

export function ApiDeleteCity() {
  return applyDecorators(
    ApiOperation({ summary: 'Удалить город' }),
    ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME),
    ApiParam({
      name: 'id',
      required: true,
      type: 'string',
      format: 'uuid',
      description: 'UUID города',
      example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    }),
    ApiResponse({
      status: 204,
      description: 'Город удалён',
    }),
    ApiResponse({
      status: 404,
      description: 'Город не найден',
    }),
    ApiResponse({
      status: 409,
      description: 'Нельзя удалить город из‑за связанных записей',
    }),
  );
}
