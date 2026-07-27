import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCompanyDTO } from './dto/create-company.sto';
import { CreateRoleDTO } from './dto/create-role.dto';
import { CreateInvitationDTO } from './dto/create-invitation.dto';
import { UpdateRoleDTO } from './dto/update-role.dto';
import { Info } from 'src/common/interfaces/info-token.interface';
import { UpdateCompanyDTO } from './dto/update-company.dto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class CompanyService {
  constructor(
    private prismaService: PrismaService,
    private emailService: EmailService,
  ) {}
  async createCompany(body: CreateCompanyDTO, user: Info) {
    try {
      let dataCompany: any = null;
      const companyId = crypto.randomUUID();
      await this.prismaService.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            id: companyId,
            name: body.name,
            taxCode: body.taxCode,
            email: body.email,
            phone: body.phone,
            address: body.address,
            website: body.website,
            logoUrl: body.logoUrl,
            description: body.description,
          },
        });
        dataCompany = company;
        const role = await tx.role.findFirst({
          where: { name: 'Owner', companyId: null },
        });

        if (!role) throw new ForbiddenException('DB thiếu dữ liệu của role');

        await tx.userCompanyRole.create({
          data: {
            companyId: company.id,
            userId: user.sub,
            roleId: role.id,
          },
        });
      });
      if (dataCompany) {
        return { data: { dataCompany, message: 'Tạo công ty thành công' } };
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('tax_code')) {
          throw new BadGatewayException(
            'Mã số thuế đã tồn tại trong hệ thống',
          );
        }
        throw new BadGatewayException(
          'Người dùng hoặc vai trò không phù hợp',
        );
      }

      console.error('Prisma error:', error);
      throw new InternalServerErrorException('Lỗi hệ thống');
    }
  }
  async infoCompany(user: Info) {
    try {
      const company = await this.prismaService.userCompanyRole.findMany({
        where: {
          userId: user.sub,
        },
        include: {
          company: true,
        },
      });
      const dataCompany = company.map((e) => e.company);

      if (company.length === 0) {
        throw new NotFoundException('Không thấy công ty');
      }
      if (!company) throw new NotFoundException('Không thấy công ty');
      return { data: dataCompany, message: 'Lấy thông tin công ty thành công' };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async createRole(companyId: string, body: CreateRoleDTO, user: Info) {
    console.log(body);
    try {
      const company = await this.prismaService.company.findUnique({
        where: { id: companyId },
      });
      if (!company) throw new NotFoundException('Công ty không tồn tại');

      const userRole = await this.prismaService.userCompanyRole.findUnique({
        where: {
          userId_companyId: {
            userId: user.sub,
            companyId,
          },
        },
        include: { role: true },
      });
      if (!userRole || userRole.role.name !== 'Owner') {
        throw new ForbiddenException(
          'Bạn không có quyền tạo role cho công ty này',
        );
      }

      const role = await this.prismaService.$transaction(async (tx) => {
        const newRole = await tx.role.create({
          data: {
            id: crypto.randomUUID(),
            companyId,
            name: body.name,
            isCustom: true,
          },
        });

        if (body.permissionIds?.length) {
          const existingPermissions = await tx.permission.findMany({
            where: { id: { in: body.permissionIds } },
            select: { id: true },
          });

          if (existingPermissions.length !== body.permissionIds.length) {
            throw new BadRequestException('Một số permission không tồn tại');
          }

          await tx.rolePermission.createMany({
            data: body.permissionIds.map((permissionId) => ({
              roleId: newRole.id,
              permissionId,
            })),
          });
        }

        return tx.role.findUnique({
          where: { id: newRole.id },
          include: { rolePermissions: { include: { permission: true } } },
        });
      });

      return { data: role, message: 'Tạo chức danh thành công' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Create role error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async listRoleOfCompany(companyId: string) {
    try {
      const roleOfCompany = await this.prismaService.role.findMany({
        where: {
          companyId,
        },
        include: {
          rolePermissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  code: true,
                  module: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!roleOfCompany)
        throw new NotFoundException('Không có role nào của công ty này');
      return {
        data: roleOfCompany,
        message: 'Lấy role của công ty thành công',
      };
    } catch (error: any) {
      console.log(error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async updateCompany(id: string, body: UpdateCompanyDTO, user: Info) {
    try {
      const userRole = await this.prismaService.userCompanyRole.findUnique({
        where: {
          userId_companyId: {
            userId: user.sub,
            companyId: id,
          },
        },
        include: { role: true },
      });

      if (!userRole || userRole.role.name !== 'Owner') {
        throw new ForbiddenException('Bạn không có quyền cập nhật công ty này');
      }

      // Cập nhật company
      const company = await this.prismaService.company.update({
        where: { id },
        data: body,
      });

      return { data: company, message: 'Cập nhật công ty thành công' };
    } catch (error: any) {
      if (error.code === 'P2025')
        throw new NotFoundException('Không tìm thấy công ty này');
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('tax_code')) {
          throw new BadGatewayException(
            'Mã số thuế đã tồn tại trong hệ thống',
          );
        }
      }
      console.log(error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async updateRole(
    companyId: string,
    roleId: string,
    body: UpdateRoleDTO,
    user: Info,
  ) {
    try {
      const company = await this.prismaService.company.findUnique({
        where: { id: companyId },
      });
      if (!company) throw new NotFoundException('Công ty không tồn tại');

      const userRole = await this.prismaService.userCompanyRole.findUnique({
        where: {
          userId_companyId: {
            userId: user.sub,
            companyId,
          },
        },
        include: { role: true },
      });
      if (!userRole || userRole.role.name !== 'Owner') {
        throw new ForbiddenException('Bạn không có quyền cập nhật role');
      }

      const existingRole = await this.prismaService.role.findFirst({
        where: { id: roleId, companyId },
      });
      if (!existingRole) throw new NotFoundException('Role không tồn tại');

      const role = await this.prismaService.$transaction(async (tx) => {
        if (body.name) {
          await tx.role.update({
            where: { id: roleId },
            data: { name: body.name },
          });
        }

        if (body.permissionIds !== undefined) {
          const existingPermissions = await tx.permission.findMany({
            where: { id: { in: body.permissionIds } },
            select: { id: true },
          });
          if (existingPermissions.length !== body.permissionIds.length) {
            throw new BadRequestException('Một số permission không tồn tại');
          }

          await tx.rolePermission.deleteMany({
            where: { roleId },
          });

          if (body.permissionIds.length > 0) {
            await tx.rolePermission.createMany({
              data: body.permissionIds.map((permissionId) => ({
                roleId,
                permissionId,
              })),
            });
          }
        }

        return tx.role.findUnique({
          where: { id: roleId },
          include: {
            rolePermissions: {
              include: {
                permission: {
                  select: {
                    id: true,
                    code: true,
                    module: true,
                    description: true,
                  },
                },
              },
            },
          },
        });
      });

      return { data: role, message: 'Cập nhật role thành công' };
    } catch (error: any) {
      if (error.code == 'P2007')
        throw new BadRequestException('Lỗi dữ liệu gửi lên');
      console.error('Update role error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async deleteRole(companyId: string, roleId: string, user: Info) {
    try {
      const company = await this.prismaService.company.findUnique({
        where: { id: companyId },
      });
      if (!company) throw new NotFoundException('Công ty không tồn tại');

      const userRole = await this.prismaService.userCompanyRole.findUnique({
        where: {
          userId_companyId: {
            userId: user.sub,
            companyId,
          },
        },
        include: { role: true },
      });
      if (!userRole || userRole.role.name !== 'Owner') {
        throw new ForbiddenException('Bạn không có quyền xoá role');
      }

      const existingRole = await this.prismaService.role.findFirst({
        where: { id: roleId, companyId },
      });
      if (!existingRole) throw new NotFoundException('Role không tồn tại');

      await this.prismaService.$transaction(async (tx) => {
        await tx.userCompanyRole.deleteMany({
          where: { roleId },
        });

        await tx.rolePermission.deleteMany({
          where: { roleId },
        });

        await tx.role.delete({
          where: { id: roleId },
        });
      });

      return { data: null, message: 'Xoá role thành công' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Delete role error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async inviteUser(companyId: string, body: CreateInvitationDTO, user: Info) {
    try {
      const company = await this.prismaService.company.findUnique({
        where: { id: companyId },
      });
      if (!company) throw new NotFoundException('Công ty không tồn tại');

      const ownerRole = await this.prismaService.userCompanyRole.findUnique({
        where: {
          userId_companyId: { userId: user.sub, companyId },
        },
        include: { role: true },
      });
      if (!ownerRole || ownerRole.role.name !== 'Owner') {
        throw new ForbiddenException('Bạn không có quyền mời nhân sự');
      }

      const invitedUser = await this.prismaService.user.findUnique({
        where: { email: body.email },
      });
      if (!invitedUser) {
        throw new NotFoundException(
          'Người dùng với email này chưa có tài khoản',
        );
      }

      const role = await this.prismaService.role.findFirst({
        where: { id: body.roleId, companyId },
      });
      if (!role)
        throw new BadRequestException('Role không tồn tại trong công ty');

      const existing = await this.prismaService.userCompanyRole.findUnique({
        where: {
          userId_companyId: { userId: invitedUser.id, companyId },
        },
      });
      if (existing)
        throw new BadRequestException(
          'Người dùng đã có chức danh trong công ty này',
        );

      await this.prismaService.$transaction(async (tx) => {
        await tx.userCompanyRole.create({
          data: {
            userId: invitedUser.id,
            companyId,
            roleId: role.id,
          },
        });
      });

      this.emailService.sendInvitation({
        to: invitedUser.email,
        toName: invitedUser.fullName,
        companyName: company.name,
        roleName: role.name,
      });

      return { data: null, message: 'Mời nhân sự thành công' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Invite user error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }
}
