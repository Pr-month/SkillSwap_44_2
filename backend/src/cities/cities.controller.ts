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
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CitySearchQuery } from './dto/city-search.query';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/users.enums';
// Подключаем группу Cities в Swagger
import {
  ApiCitiesTag,
  ApiCreateCity,
  ApiListCities,
  ApiGetCityById,
  ApiUpdateCity,
  ApiDeleteCity,
} from './decorators/cities-swagger.decorators';

@Controller('cities')
@ApiCitiesTag()
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Post()
  @ApiCreateCity()
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  @Get()
  @ApiListCities()
  findAll(@Query() query: CitySearchQuery) {
    return this.citiesService.findAll(query);
  }

  @Get(':id')
  @ApiGetCityById()
  findOne(@Param('id') id: string) {
    return this.citiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Patch(':id')
  @ApiUpdateCity()
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.citiesService.update(id, updateCityDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Delete(':id')
  @ApiDeleteCity()
  remove(@Param('id') id: string) {
    return this.citiesService.remove(id);
  }
}
