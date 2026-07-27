import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';

@Controller('skills')
export class SkillsController {
  constructor(private skillService: SkillsService) {}

  @Get('list-skill')
  @UseGuards(AccessTokenGuard)
  getSkill() {
    return this.skillService.getSkill();
  }
}
