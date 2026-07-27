import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import {
  EMAIL_QUEUE,
  SEND_INVITATION_JOB,
  APPLICATION_STATUS_CHANGE_JOB,
  InvitationJobData,
  StatusChangeJobData,
} from './email.constant';

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
}
