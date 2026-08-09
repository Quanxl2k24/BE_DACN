import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { ApplicationStatus, JobStatus } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { Info } from "src/common/interfaces/info-token.interface";
import { ApplicationService } from "src/application/application.service";
import { UpdateApplicationStatusDTO } from "src/application/dto/update-application-status.dto";
import { QueryCandidatesDTO } from "./dto/query-candidates.dto";
import { CreateInterviewDTO } from "./dto/create-interview.dto";
import { QueryInterviewsDTO } from "./dto/query-interviews.dto";

const PASSED_STATUSES: ApplicationStatus[] = [ApplicationStatus.OFFERED, ApplicationStatus.HIRED];

const BLOCKED_STATUSES_FOR_INTERVIEW: ApplicationStatus[] = [
    ApplicationStatus.OFFERED,
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
];

function toInterviewResult(status: ApplicationStatus): 'Đạt' | 'Trượt' | 'Chưa có kết quả' {
    if (PASSED_STATUSES.includes(status)) return 'Đạt';
    if (status === ApplicationStatus.REJECTED) return 'Trượt';
    return 'Chưa có kết quả';
}

function getCurrentWeekRange(now: Date) {
    const start = new Date(now);
    const dayIndex = (start.getDay() + 6) % 7; // 0 = Monday
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - dayIndex);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return { start, end };
}

@Injectable()
export class CandidatesService {
    constructor(
        private prismaService: PrismaService,
        private applicationService: ApplicationService,
    ) { }

    async getCandidates(companyId: string, user: Info, query: QueryCandidatesDTO) {
        try {
            const company = await this.prismaService.company.findUnique({
                where: { id: companyId },
            });
            if (!company) throw new NotFoundException('Công ty không tồn tại');

            const userRole = await this.prismaService.userCompanyRole.findUnique({
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

            const take = query.take ?? 20;

            const jobWhere: any = { companyId };
            if (query.onlyActiveJobs) {
                jobWhere.deletedAt = null;
                jobWhere.status = JobStatus.PUBLISHED;
                jobWhere.OR = [{ expiredAt: null }, { expiredAt: { gt: new Date() } }];
            }

            const where: any = { job: jobWhere };
            if (query.jobId) where.jobId = query.jobId;
            if (query.status) where.status = query.status;
            if (query.name) {
                where.user = {
                    fullName: { contains: query.name, mode: 'insensitive' },
                };
            }

            const applications = await this.prismaService.application.findMany({
                take: take + 1,
                ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
                where,
                orderBy: { appliedAt: 'desc' },
                select: {
                    id: true,
                    status: true,
                    appliedAt: true,
                    user: { select: { id: true, fullName: true } },
                    job: { select: { id: true, title: true } },
                    resume: { select: { fileUrl: true } },
                },
            });

            const hasMore = applications.length > take;
            const items = hasMore ? applications.slice(0, take) : applications;

            const data = items.map((application) => ({
                applicationId: application.id,
                userId: application.user.id,
                name: application.user.fullName,
                jobId: application.job.id,
                jobTitle: application.job.title,
                cvUrl: application.resume.fileUrl,
                status: application.status,
                appliedAt: application.appliedAt,
            }));

            const nextCursor = hasMore ? items[items.length - 1].id : null;

            return { data, pagination: { nextCursor, hasMore } };
        } catch (error: any) {
            if (error instanceof ForbiddenException || error instanceof NotFoundException) throw error;
            console.error('Get candidates error:', error);
            throw new InternalServerErrorException("Đã có lỗi xảy ra");
        }
    }

    async updateCandidateStatus(
        companyId: string,
        applicationId: string,
        body: UpdateApplicationStatusDTO,
        user: Info,
    ) {
        return this.applicationService.updateApplicationStatus(companyId, applicationId, body, user);
    }

    async scheduleInterview(companyId: string, body: CreateInterviewDTO, user: Info) {
        try {
            const company = await this.prismaService.company.findUnique({
                where: { id: companyId },
            });
            if (!company) throw new NotFoundException('Công ty không tồn tại');

            const schedulerRole = await this.prismaService.userCompanyRole.findUnique({
                where: { userId_companyId: { userId: user.sub, companyId } },
                include: {
                    role: {
                        include: { rolePermissions: { include: { permission: true } } },
                    },
                },
            });
            if (!schedulerRole) throw new ForbiddenException('Bạn không thuộc công ty này');

            const isSchedulerOwner = schedulerRole.role.name === 'Owner';
            const hasSchedulePerm = schedulerRole.role.rolePermissions.some(
                (rp) => rp.permission.code === 'APPLICATION_STATUS_UPDATE',
            );
            if (!isSchedulerOwner && !hasSchedulePerm) {
                throw new ForbiddenException('Bạn không có quyền đặt lịch phỏng vấn');
            }

            const job = await this.prismaService.job.findUnique({ where: { id: body.jobId } });
            if (!job || job.deletedAt || job.companyId !== companyId) {
                throw new NotFoundException('Tin tuyển dụng không tồn tại trong công ty này');
            }

            const application = await this.prismaService.application.findUnique({
                where: { jobId_userId: { jobId: body.jobId, userId: body.candidateId } },
            });
            if (!application) {
                throw new NotFoundException('Ứng viên chưa ứng tuyển vào tin tuyển dụng này');
            }
            if (BLOCKED_STATUSES_FOR_INTERVIEW.includes(application.status)) {
                throw new BadRequestException(
                    `Không thể đặt lịch phỏng vấn khi đơn ứng tuyển đang ở trạng thái ${application.status}`,
                );
            }

            const scheduledAt = new Date(body.scheduledAt);
            if (scheduledAt <= new Date()) {
                throw new BadRequestException('Thời gian phỏng vấn phải ở tương lai');
            }

            const interviewerRole = await this.prismaService.userCompanyRole.findUnique({
                where: { userId_companyId: { userId: body.interviewerId, companyId } },
                include: {
                    role: {
                        include: { rolePermissions: { include: { permission: true } } },
                    },
                },
            });
            if (!interviewerRole) {
                throw new BadRequestException('Người phỏng vấn không thuộc công ty này');
            }
            const isInterviewerOwner = interviewerRole.role.name === 'Owner';
            const canConductInterview = interviewerRole.role.rolePermissions.some(
                (rp) => rp.permission.code === 'INTERVIEW_CONDUCT',
            );
            if (!isInterviewerOwner && !canConductInterview) {
                throw new ForbiddenException('Người được chọn không có quyền phỏng vấn ứng viên');
            }

            const interview = await this.prismaService.$transaction(async (tx) => {
                const created = await tx.interview.create({
                    data: {
                        applicationId: application.id,
                        interviewerId: body.interviewerId,
                        scheduledBy: user.sub,
                        mode: body.mode,
                        location: body.location,
                        scheduledAt,
                        note: body.note ?? null,
                    },
                });

                if (application.status !== ApplicationStatus.INTERVIEW) {
                    await tx.application.update({
                        where: { id: application.id },
                        data: { status: ApplicationStatus.INTERVIEW },
                    });

                    await tx.applicationHistory.create({
                        data: {
                            applicationId: application.id,
                            changedBy: user.sub,
                            fromStatus: application.status,
                            toStatus: ApplicationStatus.INTERVIEW,
                            note: 'Tự động chuyển trạng thái khi đặt lịch phỏng vấn',
                        },
                    });
                }

                return created;
            });

            return { data: interview, message: 'Đặt lịch phỏng vấn thành công' };
        } catch (error: any) {
            if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
            console.error('Schedule interview error:', error);
            throw new InternalServerErrorException("Đã có lỗi xảy ra");
        }
    }

    async getInterviews(companyId: string, user: Info, query: QueryInterviewsDTO) {
        try {
            const company = await this.prismaService.company.findUnique({
                where: { id: companyId },
            });
            if (!company) throw new NotFoundException('Công ty không tồn tại');

            const userRole = await this.prismaService.userCompanyRole.findUnique({
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
                throw new ForbiddenException('Bạn không có quyền xem lịch phỏng vấn');
            }

            const take = query.take ?? 20;

            const interviews = await this.prismaService.interview.findMany({
                take: take + 1,
                ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
                where: { application: { job: { companyId } } },
                orderBy: { scheduledAt: 'desc' },
                select: {
                    id: true,
                    scheduledAt: true,
                    application: {
                        select: {
                            status: true,
                            user: { select: { id: true, fullName: true } },
                            job: { select: { id: true, title: true } },
                            resume: { select: { fileUrl: true } },
                        },
                    },
                    interviewer: { select: { id: true, fullName: true } },
                },
            });

            const hasMore = interviews.length > take;
            const items = hasMore ? interviews.slice(0, take) : interviews;

            const data = items.map((interview) => ({
                interviewId: interview.id,
                userId: interview.application.user.id,
                candidateName: interview.application.user.fullName,
                jobId: interview.application.job.id,
                jobTitle: interview.application.job.title,
                scheduledAt: interview.scheduledAt,
                interviewer: interview.interviewer.fullName,
                status: toInterviewResult(interview.application.status),
                cvUrl: interview.application.resume.fileUrl,
            }));

            const nextCursor = hasMore ? items[items.length - 1].id : null;

            return { data, pagination: { nextCursor, hasMore } };
        } catch (error: any) {
            if (error instanceof ForbiddenException || error instanceof NotFoundException) throw error;
            console.error('Get interviews error:', error);
            throw new InternalServerErrorException("Đã có lỗi xảy ra");
        }
    }

    async getDashboard(companyId: string, user: Info) {
        try {
            const company = await this.prismaService.company.findUnique({
                where: { id: companyId },
            });
            if (!company) throw new NotFoundException('Công ty không tồn tại');

            const userRole = await this.prismaService.userCompanyRole.findUnique({
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
                throw new ForbiddenException('Bạn không có quyền xem thống kê tuyển dụng');
            }

            const now = new Date();
            const activeJobWhere = {
                companyId,
                deletedAt: null,
                status: JobStatus.PUBLISHED,
                OR: [{ expiredAt: null }, { expiredAt: { gt: now } }],
            };
            const { start: weekStart, end: weekEnd } = getCurrentWeekRange(now);

            const [
                activeJobsCount,
                applicationsForActiveJobsCount,
                interviewsThisWeekCount,
                totalApplicationsCount,
                passedApplicationsCount,
                passedCandidates,
            ] = await Promise.all([
                this.prismaService.job.count({ where: activeJobWhere }),
                this.prismaService.application.count({ where: { job: activeJobWhere } }),
                this.prismaService.interview.count({
                    where: {
                        application: { job: { companyId } },
                        scheduledAt: { gte: weekStart, lt: weekEnd },
                    },
                }),
                this.prismaService.application.count({ where: { job: { companyId } } }),
                this.prismaService.application.count({
                    where: { job: { companyId }, status: { in: PASSED_STATUSES } },
                }),
                this.prismaService.application.findMany({
                    where: { job: { companyId }, status: { in: PASSED_STATUSES } },
                    orderBy: { updatedAt: 'desc' },
                    select: {
                        user: { select: { id: true, fullName: true } },
                        job: { select: { id: true, title: true } },
                    },
                }),
            ]);

            const successRate = totalApplicationsCount > 0
                ? Math.round((passedApplicationsCount / totalApplicationsCount) * 10000) / 100
                : 0;

            return {
                data: {
                    activeJobsCount,
                    applicationsForActiveJobsCount,
                    interviewsThisWeekCount,
                    successRate,
                    passedCandidates: passedCandidates.map((application) => ({
                        userId: application.user.id,
                        name: application.user.fullName,
                        jobId: application.job.id,
                        jobTitle: application.job.title,
                    })),
                },
            };
        } catch (error: any) {
            if (error instanceof ForbiddenException || error instanceof NotFoundException) throw error;
            console.error('Get dashboard error:', error);
            throw new InternalServerErrorException("Đã có lỗi xảy ra");
        }
    }
}
