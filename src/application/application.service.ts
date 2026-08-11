import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, JobStatus, OfferStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Info } from 'src/common/interfaces/info-token.interface';
import { EmailService } from 'src/email/email.service';
import { CreateApplicationDTO } from './dto/create-application.dto';
import { QueryApplicationsDTO } from './dto/query-applications.dto';
import { QueryMyApplicationsDTO } from './dto/query-my-applications.dto';
import { UpdateApplicationStatusDTO } from './dto/update-application-status.dto';
import { OfferDecision, RespondToOfferDTO } from './dto/respond-to-offer.dto';

const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.APPLIED]: [ApplicationStatus.SCREENING, ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED],
  [ApplicationStatus.SCREENING]: [ApplicationStatus.INTERVIEW, ApplicationStatus.OFFERED, ApplicationStatus.REJECTED],
  [ApplicationStatus.INTERVIEW]: [ApplicationStatus.OFFERED, ApplicationStatus.HIRED, ApplicationStatus.REJECTED],
  [ApplicationStatus.OFFERED]: [ApplicationStatus.HIRED, ApplicationStatus.REJECTED],
  [ApplicationStatus.HIRED]: [],
  [ApplicationStatus.REJECTED]: [],
};

@Injectable()
export class ApplicationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) { }

  async apply(jobId: string, body: CreateApplicationDTO, user: Info) {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job || job.deletedAt) {
        throw new NotFoundException('Tin tuyển dụng không tồn tại');
      }

      if (job.status !== JobStatus.PUBLISHED) {
        throw new BadRequestException('Tin tuyển dụng không ở trạng thái mở tuyển');
      }

      if (job.expiredAt && job.expiredAt < new Date()) {
        throw new BadRequestException('Tin tuyển dụng đã hết hạn');
      }

      const userCompanyRole = await this.prisma.userCompanyRole.findUnique({
        where: {
          userId_companyId: { userId: user.sub, companyId: job.companyId },
        },
      });
      if (userCompanyRole) {
        throw new ForbiddenException('Bạn không thể ứng tuyển vào công ty của mình');
      }

      const resume = await this.prisma.resume.findFirst({
        where: { id: body.resumeId, userId: user.sub },
      });
      if (!resume) {
        throw new NotFoundException('CV không tồn tại');
      }

      const existingApplication = await this.prisma.application.findUnique({
        where: { jobId_userId: { jobId, userId: user.sub } },
      });
      if (existingApplication) {
        throw new BadRequestException('Bạn đã nộp đơn cho tin tuyển dụng này rồi');
      }

      const application = await this.prisma.application.create({
        data: {
          jobId,
          userId: user.sub,
          resumeId: body.resumeId,
        },
      });

      return { data: application, message: 'Nộp đơn thành công' };
    }
    catch (error: any) {
      console.log(error)
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException("Đã có lỗi xảy ra")
    }
  }

  async getCompanyApplications(companyId: string, user: Info, query: QueryApplicationsDTO) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
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
    const hasCvViewPerm = userRole.role.rolePermissions.some(
      (rp) => rp.permission.code === 'CV_VIEW',
    );
    if (!isOwner && !hasCvViewPerm) {
      throw new ForbiddenException('Bạn không có quyền xem hồ sơ ứng viên');
    }

    const take = query.take ? parseInt(query.take, 10) : 20;

    const where: any = {
      job: { companyId },
    };

    if (query.jobId) where.jobId = query.jobId;
    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.resume = {
        parsedData: { path: ['$'], string_contains: query.keyword },
      };
    }
    if (query.applicantName) {
      where.user = {
        fullName: { contains: query.applicantName, mode: 'insensitive' },
      };
    }
    if (query.dateFrom || query.dateTo) {
      where.appliedAt = {};
      if (query.dateFrom) where.appliedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.appliedAt.lte = new Date(query.dateTo);
    }

    const orderBy: any =
      query.sort === 'oldest' ? { appliedAt: 'asc' } : { appliedAt: 'desc' };

    const applications = await this.prisma.application.findMany({
      take: take + 1,
      ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
      where,
      orderBy,
      include: {
        job: { select: { id: true, title: true } },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        resume: { select: { id: true, fileUrl: true, publicId: true, parsedData: true } },
      },
    });

    const hasMore = applications.length > take;
    const data = hasMore ? applications.slice(0, take) : applications;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, pagination: { nextCursor, hasMore } };
  }

  async updateApplicationStatus(
    companyId: string,
    applicationId: string,
    body: UpdateApplicationStatusDTO,
    user: Info,
  ) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true, user: true },
      });
      if (!application) throw new NotFoundException('Đơn ứng tuyển không tồn tại');
      if (application.job.companyId !== companyId) {
        throw new ForbiddenException('Đơn ứng tuyển không thuộc công ty này');
      }

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
      const hasStatusUpdatePerm = userRole.role.rolePermissions.some(
        (rp) => rp.permission.code === 'APPLICATION_STATUS_UPDATE',
      );
      if (!isOwner && !hasStatusUpdatePerm) {
        throw new ForbiddenException('Bạn không có quyền cập nhật trạng thái ứng tuyển');
      }

      const allowedNextStatuses = VALID_TRANSITIONS[application.status];
      if (!allowedNextStatuses.includes(body.status)) {
        throw new BadRequestException(
          `Không thể chuyển trạng thái từ ${application.status} sang ${body.status}`,
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.application.update({
          where: { id: applicationId },
          data: { status: body.status },
        });

        await tx.applicationHistory.create({
          data: {
            applicationId,
            changedBy: user.sub,
            fromStatus: application.status,
            toStatus: body.status,
            note: body.note ?? null,
          },
        });

        return updated;
      });

      try {
        await this.emailService.sendStatusChangeEmail({
          to: application.user.email,
          toName: application.user.fullName,
          jobTitle: application.job.title,
          newStatus: body.status,
          note: body.note,
        });
      } catch (emailError) {
        console.error('Send status change email failed:', emailError);
      }

      return { data: result, message: 'Cập nhật trạng thái thành công' };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) throw error;
      console.error('Update application status error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async getMyApplications(user: Info, query: QueryMyApplicationsDTO) {
    const take = query.take ?? 20;

    const applications = await this.prisma.application.findMany({
      take: take + 1,
      ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
      where: { userId: user.sub },
      orderBy: { appliedAt: 'desc' },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    });

    const hasMore = applications.length > take;
    const items = hasMore ? applications.slice(0, take) : applications;

    const data = items.map((application) => ({
      applicationId: application.id,
      jobId: application.job.id,
      jobTitle: application.job.title,
      companyName: application.job.company.name,
      companyLogoUrl: application.job.company.logoUrl,
      appliedAt: application.appliedAt,
      status: application.status,
    }));

    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { data, pagination: { nextCursor, hasMore } };
  }

  async getApplicationStatusTimeline(jobId: string, user: Info) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { jobId_userId: { jobId, userId: user.sub } },
        include: {
          job: { select: { id: true, title: true } },
          histories: { orderBy: { createdAt: 'asc' } },
          offer: true,
        },
      });
      if (!application) {
        throw new NotFoundException('Bạn chưa ứng tuyển vào tin tuyển dụng này');
      }

      const firstHistoryByStatus = new Map<ApplicationStatus, (typeof application.histories)[number]>();
      for (const history of application.histories) {
        if (!firstHistoryByStatus.has(history.toStatus)) {
          firstHistoryByStatus.set(history.toStatus, history);
        }
      }

      const offeredEntry = firstHistoryByStatus.get(ApplicationStatus.OFFERED);
      const rejectedEntry = firstHistoryByStatus.get(ApplicationStatus.REJECTED);

      const steps = [
        {
          key: 'APPLIED',
          label: 'Đã ứng tuyển',
          reached: true,
          note: null as string | null,
          at: application.appliedAt as Date | null,
        },
        {
          key: 'SCREENING',
          label: 'Đang xem xét',
          reached: firstHistoryByStatus.has(ApplicationStatus.SCREENING),
          note: firstHistoryByStatus.get(ApplicationStatus.SCREENING)?.note ?? null,
          at: firstHistoryByStatus.get(ApplicationStatus.SCREENING)?.createdAt ?? null,
        },
        {
          key: 'INTERVIEW',
          label: 'Mời phỏng vấn',
          reached: firstHistoryByStatus.has(ApplicationStatus.INTERVIEW),
          note: firstHistoryByStatus.get(ApplicationStatus.INTERVIEW)?.note ?? null,
          at: firstHistoryByStatus.get(ApplicationStatus.INTERVIEW)?.createdAt ?? null,
        },
        {
          key: 'INTERVIEW_PASSED',
          label: 'Đạt phỏng vấn',
          reached: !!offeredEntry,
          note: offeredEntry?.note ?? null,
          at: offeredEntry?.createdAt ?? null,
        },
        {
          key: 'OFFERED',
          label: 'Offer',
          reached: !!offeredEntry,
          note: offeredEntry?.note ?? null,
          at: offeredEntry?.createdAt ?? null,
        },
        {
          key: 'HIRED',
          label: 'Ứng tuyển thành công',
          reached: firstHistoryByStatus.has(ApplicationStatus.HIRED),
          note: firstHistoryByStatus.get(ApplicationStatus.HIRED)?.note ?? null,
          at: firstHistoryByStatus.get(ApplicationStatus.HIRED)?.createdAt ?? null,
        },
      ];

      return {
        data: {
          jobId: application.job.id,
          jobTitle: application.job.title,
          currentStatus: application.status,
          isRejected: application.status === ApplicationStatus.REJECTED,
          rejectedNote: rejectedEntry?.note ?? null,
          rejectedAt: rejectedEntry?.createdAt ?? null,
          steps,
          offer: application.offer,
        },
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error('Get application status timeline error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async respondToOffer(jobId: string, user: Info, body: RespondToOfferDTO) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { jobId_userId: { jobId, userId: user.sub } },
        include: { job: true, offer: { include: { creator: true } }, user: true },
      });
      if (!application || !application.offer) {
        throw new NotFoundException('Không tìm thấy lời mời nhận việc cho tin tuyển dụng này');
      }

      const { offer } = application;

      if (offer.status !== OfferStatus.PENDING) {
        throw new BadRequestException('Lời mời đã được phản hồi trước đó');
      }
      if (offer.responseDeadline && offer.responseDeadline < new Date()) {
        throw new BadRequestException('Lời mời đã hết hạn phản hồi');
      }

      const targetStatus =
        body.decision === OfferDecision.ACCEPTED
          ? ApplicationStatus.HIRED
          : ApplicationStatus.REJECTED;
      const offerStatus =
        body.decision === OfferDecision.ACCEPTED ? OfferStatus.ACCEPTED : OfferStatus.DECLINED;

      const result = await this.prisma.$transaction(async (tx) => {
        const updatedOffer = await tx.offer.update({
          where: { id: offer.id },
          data: { status: offerStatus, respondedAt: new Date() },
        });

        const updatedApplication = await tx.application.update({
          where: { id: application.id },
          data: { status: targetStatus },
        });

        await tx.applicationHistory.create({
          data: {
            applicationId: application.id,
            changedBy: user.sub,
            fromStatus: application.status,
            toStatus: targetStatus,
            note:
              body.decision === OfferDecision.ACCEPTED
                ? 'Ứng viên chấp nhận lời mời'
                : 'Ứng viên từ chối lời mời',
          },
        });

        return { application: updatedApplication, offer: updatedOffer };
      });

      try {
        await this.emailService.sendOfferRespondedEmail({
          to: offer.creator.email,
          toName: offer.creator.fullName,
          jobTitle: application.job.title,
          candidateName: application.user.fullName,
          decision: body.decision,
        });
      } catch (emailError) {
        console.error('Send offer responded email failed:', emailError);
      }

      return { data: result, message: 'Đã ghi nhận phản hồi' };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      console.error('Respond to offer error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }
}