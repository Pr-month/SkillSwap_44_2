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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RequestWithUser } from 'src/auth/auth.types';
import { SWAGGER_AUTH_SCHEME_NAME } from '../config/swagger.config';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME)
  @ApiOperation({ summary: 'Создать навык' })
  @ApiResponse({
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
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные в теле запроса' })
  @ApiResponse({ status: 401, description: 'Неавторизованный запрос' })
  create(@Req() req: RequestWithUser, @Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(req.user.sub, createSkillDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список навыков (с пагинацией)' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Номер страницы (начиная с 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Количество элементов на странице',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Поиск по названию навыка',
    example: 'guitar',
  })
  @ApiResponse({
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
  })
  @ApiResponse({ status: 400, description: 'Недопустимые параметры запроса' })
  @ApiResponse({ status: 404, description: 'Страница не найдена' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.skillsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить навык по ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID навыка',
    example: 'skill-123',
  })
  @ApiResponse({
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
  })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Частично обновить навык' })
  @ApiParam({
    name: 'id',
    description: 'UUID навыка',
    example: 'skill-123',
  })
  @ApiResponse({
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
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные в теле запроса' })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(id, updateSkillDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME)
  @ApiOperation({ summary: 'Удалить навык (только владелец)' })
  @ApiParam({
    name: 'id',
    description: 'UUID навыка',
    example: 'skill-123',
  })
  @ApiResponse({
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
  })
  @ApiResponse({ status: 401, description: 'Неавторизованный запрос' })
  @ApiResponse({ status: 403, description: 'Пользователь не является владельцем навыка' })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return await this.skillsService.remove(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  @ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME)
  @ApiOperation({ summary: 'Добавить навык в избранное' })
  @ApiParam({
    name: 'id',
    description: 'UUID навыка',
    example: 'skill-123',
  })
  @ApiResponse({
    status: 201,
    description: 'Навык добавлен в избранное',
    schema: {
      example: { message: 'Skill added to favorites' },
    },
  })
  @ApiResponse({ status: 401, description: 'Неавторизованный запрос' })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  @ApiResponse({ status: 409, description: 'Навык уже в избранном' })
  async addToFavorite(
    @Param('id') skillId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.sub;
    await this.skillsService.addToFavorite(userId, skillId);
    return { message: 'Skill added to favorites' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorite')
  @ApiBearerAuth(SWAGGER_AUTH_SCHEME_NAME)
  @ApiOperation({ summary: 'Убрать навык из избранного' })
  @ApiParam({
    name: 'id',
    description: 'UUID навыка',
    example: 'skill-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Навык убран из избранного',
    schema: {
      example: { message: 'Skill removed from favorites' },
    },
  })
  @ApiResponse({ status: 401, description: 'Неавторизованный запрос' })
  @ApiResponse({ status: 404, description: 'Навык не был в избранном' })
  async removeFromFavorite(
    @Param('id') skillId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.sub;    
    await this.skillsService.removeFromFavorite(userId, skillId);
    return { message: 'Skill removed from favorites' };
  }
}
