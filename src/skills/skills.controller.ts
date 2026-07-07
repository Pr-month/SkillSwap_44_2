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
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequestWithUser } from '../auth/auth.types';
import { ApiTags } from '@nestjs/swagger';
import { Skill } from './entities/skill.entity';

import {
  ApiCreateSkill,
  ApiListSkills,
  ApiGetSkillById,
  ApiUpdateSkill,
  ApiDeleteSkill,
  ApiAddToFavorite,
  ApiRemoveFromFavorite,
} from './decorators/skills-swagger.decorators';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiCreateSkill()
  create(
    @Req() req: RequestWithUser,
    @Body() createSkillDto: CreateSkillDto,
  ): Promise<Skill> {
    return this.skillsService.create(req.user.sub, createSkillDto);
  }

  @Get()
  @ApiListSkills()
  findAll(@Query() query: PaginationQueryDto) {
    return this.skillsService.findAll(query);
  }

  @Get(':id')
  @ApiGetSkillById()
  findOne(@Param('id') id: string): Promise<Skill> {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateSkill()
  update(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
  ): Promise<Skill> {
    return this.skillsService.update(id, updateSkillDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiDeleteSkill()
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Skill> {
    return await this.skillsService.remove(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  @ApiAddToFavorite()
  async addToFavorite(
    @Param('id') skillId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const userId = req.user.sub;
    await this.skillsService.addToFavorite(userId, skillId);
    return { message: 'Skill added to favorites' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorite')
  @ApiRemoveFromFavorite()
  async removeFromFavorite(
    @Param('id') skillId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const userId = req.user.sub;
    await this.skillsService.removeFromFavorite(userId, skillId);
    return { message: 'Skill removed from favorites' };
  }
}
