export const EMAIL_QUEUE = 'email';

export const SEND_INVITATION_JOB = 'send-invitation';

export const APPLICATION_STATUS_CHANGE_JOB = 'application-status-change';

export interface InvitationJobData {
  to: string;
  toName: string | null;
  companyName: string;
  roleName: string;
}

export interface StatusChangeJobData {
  to: string;
  toName: string | null;
  jobTitle: string;
  newStatus: string;
  note?: string;
}
