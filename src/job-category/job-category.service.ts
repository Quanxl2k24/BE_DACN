import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateJobCategoryDTO } from './dto/create-job-category.dto';
import { UpdateJobCategoryDTO } from './dto/update-job-category.dto';

@Injectable()
export class JobCategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const data = await this.prisma.jobCategory.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      });
      return { data, message: 'Lấy danh sách danh mục ngành nghề thành công' };
    } catch (error: any) {
      console.error('Find job categories error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async create(body: CreateJobCategoryDTO) {
    try {
      const existing = await this.prisma.jobCategory.findUnique({
        where: { name: body.name },
      });
      if (existing) {
        throw new BadRequestException('Danh mục ngành nghề đã tồn tại');
      }

      const data = await this.prisma.jobCategory.create({
        data: { name: body.name },
      });
      return { data, message: 'Tạo danh mục ngành nghề thành công' };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      console.error('Create job category error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async update(id: number, body: UpdateJobCategoryDTO) {
    try {
      const category = await this.prisma.jobCategory.findUnique({
        where: { id },
      });
      if (!category) throw new NotFoundException('Danh mục ngành nghề không tồn tại');

      if (body.name !== undefined && body.name !== category.name) {
        const existing = await this.prisma.jobCategory.findUnique({
          where: { name: body.name },
        });
        if (existing) {
          throw new BadRequestException('Tên danh mục ngành nghề đã tồn tại');
        }
      }

      const data = await this.prisma.jobCategory.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.active !== undefined && { active: body.active }),
        },
      });
      return { data, message: 'Cập nhật danh mục ngành nghề thành công' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Update job category error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async remove(id: number) {
    try {
      const category = await this.prisma.jobCategory.findUnique({
        where: { id },
      });
      if (!category) throw new NotFoundException('Danh mục ngành nghề không tồn tại');

      await this.prisma.jobCategory.update({
        where: { id },
        data: { active: false },
      });
      return { data: null, message: 'Xoá danh mục ngành nghề thành công' };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error('Delete job category error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }
}
