import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SkillsService {
  constructor(private prismaService: PrismaService) {}

  async getSkill() {
    try {
      const listSkills = await this.prismaService.skill.findMany();
      if (listSkills.length == 0)
        throw new InternalServerErrorException('Db bị thiếu dữ liệu');
      return { data: listSkills, message: 'Lấy skills thành công' };
    } catch (error: any) {
      console.log(error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }
}
