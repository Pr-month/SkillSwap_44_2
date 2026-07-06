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
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RequestWithUser } from 'src/auth/auth.types';
import { Skill } from './entities/skill.entity';
import {
  ApiSkillsController,
  ApiSkillsDelete,
  ApiSkillsDeleteFavorite,
  ApiSkillsGetAll,
  ApiSkillsGetOne,
  ApiSkillsPatch,
  ApiSkillsPost,
  ApiSkillsPostFavorite,
} from './skills.swagger';

@ApiSkillsController()
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @ApiSkillsPost()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: RequestWithUser,
    @Body() createSkillDto: CreateSkillDto,
  ): Promise<Skill> {
    return this.skillsService.create(req.user.sub, createSkillDto);
  }

  @ApiSkillsGetAll()
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.skillsService.findAll(query);
  }

  @ApiSkillsGetOne()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Skill> {
    return this.skillsService.findOne(id);
  }

  @ApiSkillsPatch()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
  ): Promise<Skill> {
    return this.skillsService.update(id, updateSkillDto);
  }

  @ApiSkillsDelete()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Skill> {
    return await this.skillsService.remove(id, req.user.sub);
  }

  @ApiSkillsPostFavorite()
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

  @ApiSkillsDeleteFavorite()
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
