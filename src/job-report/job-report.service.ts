import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateJobReportDTO } from './dto/create-job-report.dto';
import { UpdateJobReportDTO } from './dto/update-job-report.dto';
import { Info } from 'src/common/interfaces/info-token.interface';
import { JobStatus, ReportStatus } from 'generated/prisma/client';

@Injectable()
export class JobReportService {
  constructor(private prisma: PrismaService) { }

  async create(body: CreateJobReportDTO, user: Info) {
    try {
      const job = await this.prisma.job.findUnique({ where: { id: body.jobId } });
      if (!job) throw new NotFoundException('Tin tuyển dụng không tồn tại');

      const existing = await this.prisma.jobReport.findUnique({
        where: { userId_jobId: { userId: user.sub, jobId: body.jobId } },
      });
      if (existing) throw new ConflictException('Bạn đã báo cáo tin tuyển dụng này rồi');

      const report = await this.prisma.jobReport.create({
        data: {
          id: crypto.randomUUID(),
          jobId: body.jobId,
          userId: user.sub,
          reason: body.reason,
        },
      });

      return { data: report, message: 'Báo cáo thành công' };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      console.error('Create report error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async findAll(user: Info, cursor?: string, take = 20) {
    if (user.type == "ADMIN") throw new ForbiddenException("Bạn không có quyền truy cập")
    const reports = await this.prisma.jobReport.findMany({
      take: take + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { id: true, title: true } },
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    const hasMore = reports.length > take;
    const data = hasMore ? reports.slice(0, take) : reports;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, pagination: { nextCursor, hasMore } };
  }

  async update(user: Info, id: string, body: UpdateJobReportDTO) {
    if (user.type == "ADMIN") throw new ForbiddenException("Bạn không có quyền truy cập")
    try {
      const report = await this.prisma.jobReport.findUnique({
        where: { id },
        include: { job: true },
      });
      if (!report) throw new NotFoundException('Báo cáo không tồn tại');

      await this.prisma.$transaction(async (tx) => {
        await tx.jobReport.update({
          where: { id },
          data: { status: body.status },
        });

        if (body.status === ReportStatus.RESOLVED) {
          await tx.job.update({
            where: { id: report.jobId },
            data: { status: JobStatus.SUSPENDED },
          });
        }
      });

      return { data: null, message: 'Cập nhật báo cáo thành công' };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error('Update report error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }
}
