import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CitySearchQuery } from './dto/city-search.query';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/users.enums';
import { City } from './entities/city.entity'; 
@Controller('cities')
@ApiTags('Cities') // Группировка в Swagger UI
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Post()
  @ApiOperation({ summary: 'Создать город' })
  @ApiBody({ type: CreateCityDto })
  @ApiResponse({ status: 201, description: 'Город успешно создан', type: City })
  @ApiResponse({
    status: 409,
    description: 'Город с таким именем уже существует',
  })
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список городов с фильтрацией' })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Фильтр по названию (частичное совпадение)',
  })
  @ApiQuery({
    name: 'district',
    required: false,
    type: String,
    description: 'Фильтр по району (частичное совпадение)',
  })
  @ApiQuery({
    name: 'subject',
    required: false,
    type: String,
    description: 'Фильтр по субъекту (частичное совпадение)',
  })
  @ApiResponse({ status: 200, description: 'Список городов', type: [City] })
  findAll(@Query() query: CitySearchQuery) {
    return this.citiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить город по ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
    description: 'UUID города',
  })
  @ApiResponse({ status: 200, description: 'Город найден', type: City })
  @ApiResponse({ status: 404, description: 'Город не найден' })
  findOne(@Param('id') id: string) {
    return this.citiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Patch(':id')
  @ApiOperation({ summary: 'Обновить город' })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
    description: 'UUID города',
  })
  @ApiBody({ type: UpdateCityDto })
  @ApiResponse({ status: 200, description: 'Город успешно обновлён', type: City })
  @ApiResponse({ status: 404, description: 'Город не найден' })
  @ApiResponse({
    status: 409,
    description: 'Конфликт при обновлении (например, дубликат имени)',
  })
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.citiesService.update(id, updateCityDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить город' })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
    description: 'UUID города',
  })
  @ApiResponse({ status: 204, description: 'Город удалён' })
  @ApiResponse({ status: 404, description: 'Город не найден' })
  @ApiResponse({
    status: 409,
    description: 'Нельзя удалить город из-за связанных записей',
  })
  remove(@Param('id') id: string) {
    return this.citiesService.remove(id);
  }
}
