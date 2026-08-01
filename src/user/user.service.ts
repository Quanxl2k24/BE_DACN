import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Info } from 'src/common/interfaces/info-token.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserReqDTO } from './dto/index';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}
  async getProfile(Req: Info) {
    try {
      const user = await this.prismaService.user.findUniqueOrThrow({
        where: {
          id: Req.sub,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          type: true,
          mfaEnabled: true,
        },
      });
      return {
        data: user,
        message: 'Lấy thông tin thành công',
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Không có người dùng này');
      }
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async updateUser(body: UpdateUserReqDTO, user: Info) {
    try {
      const update = await this.prismaService.user.update({
        where: {
          id: user.sub,
        },
        data: {
          ...body,
        },
      });
      return {
        data: update,
        messsage: 'Update thông tin người dùng thàn công',
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Người dùng không tồn tại');
      }
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }
}
