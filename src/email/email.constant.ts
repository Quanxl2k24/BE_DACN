export const EMAIL_QUEUE = 'email';

export const SEND_INVITATION_JOB = 'send-invitation';

export const APPLICATION_STATUS_CHANGE_JOB = 'application-status-change';

export const OFFER_EXTENDED_JOB = 'offer-extended';

export const OFFER_RESPONDED_JOB = 'offer-responded';

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

export interface OfferExtendedJobData {
  to: string;
  toName: string | null;
  jobTitle: string;
  salary: number;
  startDate: Date | null;
  responseDeadline: Date | null;
  note: string | null;
}

export interface OfferRespondedJobData {
  to: string;
  toName: string | null;
  jobTitle: string;
  candidateName: string | null;
  decision: 'ACCEPTED' | 'DECLINED';
}
