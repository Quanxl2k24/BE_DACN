import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  EMAIL_QUEUE,
  SEND_INVITATION_JOB,
  APPLICATION_STATUS_CHANGE_JOB,
  InvitationJobData,
  StatusChangeJobData,
} from './email.constant';

@Injectable()
export class EmailService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}

  async sendInvitation(data: InvitationJobData) {
    await this.emailQueue.add(SEND_INVITATION_JOB, data);
  }

  async sendStatusChangeEmail(data: StatusChangeJobData) {
    await this.emailQueue.add(APPLICATION_STATUS_CHANGE_JOB, data);
  }
}
