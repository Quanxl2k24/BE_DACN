import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissonsService {
  constructor(private prismaService: PrismaService) {}

  async listPermisson() {
    const listPermisson = await this.prismaService.permission.findMany();
    if (!listPermisson)
      throw new InternalServerErrorException('ĐB bị thiếu dữ liệu');
    return {
      data: listPermisson,
      message: 'Lấy các quyền thành công',
    };
  }
}
