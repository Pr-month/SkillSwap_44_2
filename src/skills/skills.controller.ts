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
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RequestWithUser } from 'src/auth/auth.types';
import { Skill } from './entities/skill.entity';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать навык' })
  @ApiResponse({
    status: 201,
    description: 'Навык успешно создан',
    type: Skill,
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: RequestWithUser,
    @Body() createSkillDto: CreateSkillDto,
  ): Promise<Skill> {
    return this.skillsService.create(req.user.sub, createSkillDto);
  }

  @ApiOperation({ summary: 'Получить список навыков с пагинацией' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
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
  })
  @ApiResponse({ status: 404, description: 'Страница не найдена' })
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.skillsService.findAll(query);
  }

  @ApiOperation({ summary: 'Получить навык по id' })
  @ApiParam({ name: 'id', description: 'UUID навыка' })
  @ApiResponse({
    status: 200,
    description: 'Навык успешно найден',
    type: Skill,
  })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Skill> {
    return this.skillsService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновить навык по id' })
  @ApiParam({ name: 'id', description: 'UUID навыка' })
  @ApiResponse({
    status: 200,
    description: 'Навык успешно обновлён',
    type: Skill,
  })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
  ): Promise<Skill> {
    return this.skillsService.update(id, updateSkillDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить свой навык по id' })
  @ApiParam({ name: 'id', description: 'UUID навыка' })
  @ApiResponse({
    status: 200,
    description: 'Навык успешно удалён',
    type: Skill,
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Можно удалить только свой навык' })
  @ApiResponse({ status: 404, description: 'Навык не найден' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Skill> {
    return await this.skillsService.remove(id, req.user.sub);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить навык в избранное' })
  @ApiParam({ name: 'id', description: 'UUID навыка' })
  @ApiResponse({
    status: 201,
    description: 'Навык добавлен в избранное',
    schema: { example: { message: 'Skill added to favorites' } },
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Навык или пользователь не найден' })
  @ApiResponse({ status: 409, description: 'Навык уже в избранном' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  async addToFavorite(
    @Param('id') skillId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const userId = req.user.sub;
    await this.skillsService.addToFavorite(userId, skillId);
    return { message: 'Skill added to favorites' };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить навык из избранного' })
  @ApiParam({ name: 'id', description: 'UUID навыка' })
  @ApiResponse({
    status: 200,
    description: 'Навык удалён из избранного',
    schema: { example: { message: 'Skill removed from favorites' } },
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Навык или пользователь не найден' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorite')
  async removeFromFavorite(
    @Param('id') skillId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const userId = req.user.sub;
    await this.skillsService.removeFromFavorite(userId, skillId);
    return { message: 'Skill removed from favorites' };
  }
}
