import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Skills - Kỹ năng')
@Controller('skills')
export class SkillsController {
  constructor(private skillService: SkillsService) {}

  @Get('list-skill')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách kỹ năng', description: 'Lấy danh sách tất cả kỹ năng có sẵn trong hệ thống (dùng để gắn vào tin tuyển dụng).' })
  getSkill() {
    return this.skillService.getSkill();
  }
}
