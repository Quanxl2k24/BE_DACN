import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JobCategoryService } from './job-category.service';
import { CreateJobCategoryDTO } from './dto/create-job-category.dto';
import { UpdateJobCategoryDTO } from './dto/update-job-category.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('Job Category - Danh mục ngành nghề')
@Controller('job-categories')
export class JobCategoryController {
  constructor(private jobCategoryService: JobCategoryService) {}

  @Get()
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách danh mục ngành nghề', description: 'Lấy danh sách danh mục ngành nghề đang hoạt động (dùng cho form tạo job).' })
  findAll() {
    return this.jobCategoryService.findAll();
  }

  @Post()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo danh mục ngành nghề', description: 'Tạo mới một danh mục ngành nghề (chỉ ADMIN).' })
  create(@Body() body: CreateJobCategoryDTO) {
    return this.jobCategoryService.create(body);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID danh mục ngành nghề' })
  @ApiOperation({ summary: 'Cập nhật danh mục ngành nghề', description: 'Đổi tên hoặc bật/tắt trạng thái hoạt động (chỉ ADMIN).' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateJobCategoryDTO) {
    return this.jobCategoryService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID danh mục ngành nghề' })
  @ApiOperation({ summary: 'Xoá danh mục ngành nghề', description: 'Xoá mềm danh mục ngành nghề (set active = false), chỉ ADMIN.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jobCategoryService.remove(id);
  }
}
