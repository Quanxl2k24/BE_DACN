import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateJobDTO } from './dto/create-job.dto';
import { UpdateJobDTO } from './dto/update-job.dto';
import { QueryJobsDTO } from './dto/query-jobs.dto';
import { Info } from 'src/common/interfaces/info-token.interface';

@Injectable()
export class JobService {
  constructor(private prisma: PrismaService) {}

  async createJob(body: CreateJobDTO, user: Info) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: body.companyId },
      });
      if (!company) throw new NotFoundException('Công ty không tồn tại');

      const userRole = await this.prisma.userCompanyRole.findUnique({
        where: {
          userId_companyId: { userId: user.sub, companyId: body.companyId },
        },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      });
      if (!userRole)
        throw new ForbiddenException('Bạn không thuộc công ty này');

      const isOwner = userRole.role.name === 'Owner';
      const hasJobCreatePerm = userRole.role.rolePermissions.some(
        (rp) => rp.permission.code === 'JOB_CREATE',
      );
      if (!isOwner && !hasJobCreatePerm) {
        throw new ForbiddenException('Bạn không có quyền đăng tin tuyển dụng');
      }

      const job = await this.prisma.$transaction(async (tx) => {
        const newJob = await tx.job.create({
          data: {
            id: crypto.randomUUID(),
            companyId: body.companyId,
            createdBy: user.sub,
            title: body.title,
            description: body.description ?? null,
            salaryMin: body.salaryMin,
            salaryMax: body.salaryMax,
            requirements: body.requirements ?? null,
            benefits: body.benefits ?? null,
            address: body.address ?? null,
            province: body.province ?? null,
            expiredAt: body.expiredAt ? new Date(body.expiredAt) : null,
          },
        });

        if (body.skillIds?.length) {
          const existingSkills = await tx.skill.findMany({
            where: { id: { in: body.skillIds } },
            select: { id: true },
          });
          if (existingSkills.length !== body.skillIds.length) {
            throw new NotFoundException('Một số kỹ năng không tồn tại');
          }

          await tx.jobSkill.createMany({
            data: body.skillIds.map((skillId) => ({
              jobId: newJob.id,
              skillId,
            })),
          });
        }

        return tx.job.findUnique({
          where: { id: newJob.id },
          include: {
            company: { select: { id: true, name: true, logoUrl: true } },
            jobSkills: { include: { skill: true } },
          },
        });
      });

      return { data: job, message: 'Tạo tin tuyển dụng thành công' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Create job error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async updateJob(id: string, body: UpdateJobDTO, user: Info) {
    try {
      const existingJob = await this.prisma.job.findUnique({
        where: { id },
      });
      if (!existingJob) throw new NotFoundException('Tin tuyển dụng không tồn tại');

      const userRole = await this.prisma.userCompanyRole.findUnique({
        where: {
          userId_companyId: { userId: user.sub, companyId: existingJob.companyId },
        },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      });
      if (!userRole) throw new ForbiddenException('Bạn không thuộc công ty này');

      const isOwner = userRole.role.name === 'Owner';
      const hasJobUpdatePerm = userRole.role.rolePermissions.some(
        (rp) => rp.permission.code === 'JOB_UPDATE',
      );
      if (!isOwner && !hasJobUpdatePerm) {
        throw new ForbiddenException('Bạn không có quyền cập nhật tin tuyển dụng');
      }

      const job = await this.prisma.$transaction(async (tx) => {
        const updateData: any = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.salaryMin !== undefined) updateData.salaryMin = body.salaryMin;
        if (body.salaryMax !== undefined) updateData.salaryMax = body.salaryMax;
        if (body.requirements !== undefined) updateData.requirements = body.requirements;
        if (body.benefits !== undefined) updateData.benefits = body.benefits;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.province !== undefined) updateData.province = body.province;
        if (body.expiredAt !== undefined) {
          updateData.expiredAt = body.expiredAt ? new Date(body.expiredAt) : null;
        }

        if (Object.keys(updateData).length > 0) {
          await tx.job.update({
            where: { id },
            data: updateData,
          });
        }

        if (body.skillIds !== undefined) {
          const existingSkills = await tx.skill.findMany({
            where: { id: { in: body.skillIds } },
            select: { id: true },
          });
          if (existingSkills.length !== body.skillIds.length) {
            throw new NotFoundException('Một số kỹ năng không tồn tại');
          }

          await tx.jobSkill.deleteMany({ where: { jobId: id } });

          if (body.skillIds.length > 0) {
            await tx.jobSkill.createMany({
              data: body.skillIds.map((skillId) => ({
                jobId: id,
                skillId,
              })),
            });
          }
        }

        return tx.job.findUnique({
          where: { id },
          include: {
            company: { select: { id: true, name: true, logoUrl: true } },
            jobSkills: { include: { skill: true } },
          },
        });
      });

      return { data: job, message: 'Cập nhật tin tuyển dụng thành công' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Update job error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async findActiveJobs(query: QueryJobsDTO) {
    const now = new Date();
    const take = query.take ?? 20;

    const where: any = {
      status: JobStatus.PUBLISHED,
      deletedAt: null,
      OR: [{ expiredAt: null }, { expiredAt: { gt: now } }],
    };

    if (query.keyword) {
      where.AND = {
        OR: [
          { title: { contains: query.keyword, mode: 'insensitive' } },
          { description: { contains: query.keyword, mode: 'insensitive' } },
        ],
      };
    }
    if (query.salaryFrom) where.salaryMax = { gte: query.salaryFrom };
    if (query.salaryTo) where.salaryMin = { lte: query.salaryTo };
    if (query.province) where.province = { contains: query.province, mode: 'insensitive' };
    if (query.skillIds?.length) {
      where.jobSkills = { some: { skillId: { in: query.skillIds } } };
    }

    const orderBy: any =
      query.sort === 'salary_asc' ? { salaryMin: 'asc' }
      : query.sort === 'salary_desc' ? { salaryMax: 'desc' }
      : { createdAt: 'desc' };

    const jobs = await this.prisma.job.findMany({
      take: take + 1,
      ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
      where,
      orderBy,
      select: {
        id: true,
        title: true,
        salaryMin: true,
        salaryMax: true,
        address: true,
        province: true,
        createdAt: true,
        company: { select: { name: true, logoUrl: true } },
      },
    });

    const hasMore = jobs.length > take;
    const data = hasMore ? jobs.slice(0, take) : jobs;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, pagination: { nextCursor, hasMore } };
  }

  async getCompanyJobs(companyId: string, user: Info, query: QueryJobsDTO) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Công ty không tồn tại');

    const userRole = await this.prisma.userCompanyRole.findUnique({
      where: { userId_companyId: { userId: user.sub, companyId } },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });
    if (!userRole) throw new ForbiddenException('Bạn không thuộc công ty này');

    const isOwner = userRole.role.name === 'Owner';
    const hasJobViewPerm = userRole.role.rolePermissions.some(
      (rp) => rp.permission.code === 'JOB_VIEW',
    );
    if (!isOwner && !hasJobViewPerm) {
      throw new ForbiddenException('Bạn không có quyền xem tin tuyển dụng');
    }

    const take = query.take ?? 20;
    const where: any = { companyId, deletedAt: null };

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.salaryFrom) where.salaryMax = { gte: query.salaryFrom };
    if (query.salaryTo) where.salaryMin = { lte: query.salaryTo };
    if (query.province) where.province = { contains: query.province, mode: 'insensitive' };
    if (query.skillIds?.length) {
      where.jobSkills = { some: { skillId: { in: query.skillIds } } };
    }

    const orderBy: any =
      query.sort === 'salary_asc' ? { salaryMin: 'asc' }
      : query.sort === 'salary_desc' ? { salaryMax: 'desc' }
      : { createdAt: 'desc' };

    const jobs = await this.prisma.job.findMany({
      take: take + 1,
      ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
      where,
      orderBy,
      select: {
        id: true,
        title: true,
        salaryMin: true,
        salaryMax: true,
        address: true,
        province: true,
        createdAt: true,
        status: true,
        company: { select: { name: true, logoUrl: true } },
      },
    });

    const hasMore = jobs.length > take;
    const data = hasMore ? jobs.slice(0, take) : jobs;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, pagination: { nextCursor, hasMore } };
  }

  async getJobDetail(id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, deletedAt: null, status: JobStatus.PUBLISHED },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
            website: true,
            description: true,
            email: true,
            phone: true,
          },
        },
        jobSkills: { include: { skill: true } },
      },
    });

    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    if (job.expiredAt && job.expiredAt < new Date()) {
      throw new BadRequestException('Tin tuyển dụng đã hết hạn');
    }

    return { data: job };
  }

  async getRecruiterJobDetail(id: string, user: Info) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
            website: true,
            description: true,
            email: true,
            phone: true,
          },
        },
        jobSkills: { include: { skill: true } },
        creator: { select: { id: true, fullName: true, email: true } },
        _count: { select: { applications: true } },
      },
    });

    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    const userRole = await this.prisma.userCompanyRole.findUnique({
      where: {
        userId_companyId: { userId: user.sub, companyId: job.companyId },
      },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });
    if (!userRole) throw new ForbiddenException('Bạn không thuộc công ty này');

    const isOwner = userRole.role.name === 'Owner';
    const hasJobViewPerm = userRole.role.rolePermissions.some(
      (rp) => rp.permission.code === 'JOB_VIEW',
    );
    if (!isOwner && !hasJobViewPerm) {
      throw new ForbiddenException('Bạn không có quyền xem tin tuyển dụng này');
    }

    return { data: job };
  }

  async deleteJob(id: string, user: Info) {
    try {
      const existingJob = await this.prisma.job.findUnique({
        where: { id },
      });
      if (!existingJob) throw new NotFoundException('Tin tuyển dụng không tồn tại');
      if (existingJob.deletedAt) throw new NotFoundException('Tin tuyển dụng không tồn tại');

      const userRole = await this.prisma.userCompanyRole.findUnique({
        where: {
          userId_companyId: { userId: user.sub, companyId: existingJob.companyId },
        },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      });
      if (!userRole) throw new ForbiddenException('Bạn không thuộc công ty này');

      const isOwner = userRole.role.name === 'Owner';
      const hasJobDeletePerm = userRole.role.rolePermissions.some(
        (rp) => rp.permission.code === 'JOB_DELETE',
      );
      if (!isOwner && !hasJobDeletePerm) {
        throw new ForbiddenException('Bạn không có quyền xoá tin tuyển dụng');
      }

      await this.prisma.job.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return { data: null, message: 'Xoá tin tuyển dụng thành công' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Delete job error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }
}
