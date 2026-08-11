import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import {
  EMAIL_QUEUE,
  SEND_INVITATION_JOB,
  APPLICATION_STATUS_CHANGE_JOB,
  OFFER_EXTENDED_JOB,
  OFFER_RESPONDED_JOB,
  InvitationJobData,
  StatusChangeJobData,
  OfferExtendedJobData,
  OfferRespondedJobData,
} from './email.constant';

function formatVnd(amount: number) {
  return `${amount.toLocaleString('vi-VN')} VNĐ`;
}

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('vi-VN');
}

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  constructor(private readonly mailerService: MailerService) {}

  @Process(SEND_INVITATION_JOB)
  async handleSendInvitation(job: Job<InvitationJobData>) {
    const { to, toName, companyName, roleName } = job.data;

    await this.mailerService.sendMail({
      to,
      subject: 'Bạn đã được thêm vào công ty',
      html: `
                <p>Xin chào <b>${toName || to}</b>,</p>
                <p>Bạn đã được thêm vào công ty <b>${companyName}</b> với chức danh <b>${roleName}</b>.</p>
                <p>Vui lòng đăng nhập để truy cập.</p>
            `,
    });
  }

  @Process(APPLICATION_STATUS_CHANGE_JOB)
  async handleStatusChange(job: Job<StatusChangeJobData>) {
    const { to, toName, jobTitle, newStatus, note } = job.data;

    await this.mailerService.sendMail({
      to,
      subject: `Đơn ứng tuyển "${jobTitle}" đã được cập nhật`,
      html: `
        <p>Xin chào <b>${toName || to}</b>,</p>
        <p>Đơn ứng tuyển của bạn cho vị trí <b>${jobTitle}</b> đã được cập nhật sang trạng thái: <b>${newStatus}</b>.</p>
        ${note ? `<p>Ghi chú: ${note}</p>` : ''}
        <p>Vui lòng đăng nhập để xem chi tiết.</p>
      `,
    });
  }

  @Process(OFFER_EXTENDED_JOB)
  async handleOfferExtended(job: Job<OfferExtendedJobData>) {
    const { to, toName, jobTitle, salary, startDate, responseDeadline, note } = job.data;

    await this.mailerService.sendMail({
      to,
      subject: `Bạn nhận được lời mời nhận việc cho vị trí "${jobTitle}"`,
      html: `
        <p>Xin chào <b>${toName || to}</b>,</p>
        <p>Chúc mừng! Bạn đã nhận được lời mời nhận việc cho vị trí <b>${jobTitle}</b>.</p>
        <p>Mức lương đề nghị: <b>${formatVnd(salary)}</b></p>
        ${startDate ? `<p>Ngày dự kiến bắt đầu: <b>${formatDate(startDate)}</b></p>` : ''}
        ${responseDeadline ? `<p>Hạn phản hồi: <b>${formatDate(responseDeadline)}</b></p>` : ''}
        ${note ? `<p>Ghi chú: ${note}</p>` : ''}
        <p>Vui lòng đăng nhập để xem chi tiết và phản hồi lời mời.</p>
      `,
    });
  }

  @Process(OFFER_RESPONDED_JOB)
  async handleOfferResponded(job: Job<OfferRespondedJobData>) {
    const { to, toName, jobTitle, candidateName, decision } = job.data;
    const decisionText = decision === 'ACCEPTED' ? 'đã chấp nhận' : 'đã từ chối';

    await this.mailerService.sendMail({
      to,
      subject: `Ứng viên ${decisionText} lời mời nhận việc cho vị trí "${jobTitle}"`,
      html: `
        <p>Xin chào <b>${toName || to}</b>,</p>
        <p>Ứng viên <b>${candidateName || 'Ứng viên'}</b> ${decisionText} lời mời nhận việc cho vị trí <b>${jobTitle}</b>.</p>
        <p>Vui lòng đăng nhập để xem chi tiết.</p>
      `,
    });
  }
}
