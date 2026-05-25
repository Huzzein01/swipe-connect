import { NormalizedJob } from './public-job-feed.service';
import { EmailService } from './email.service';

type ApplicantProfile = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type ResumePayload = {
  parsedData?: {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience?: Array<{
      title?: string;
      company?: string;
      description?: string;
    }>;
  };
};

export type ApplicationRecord = {
  id: string;
  job: NormalizedJob;
  applicant: ApplicantProfile;
  resumeSnapshot?: ResumePayload;
  status: 'queued' | 'needs-review' | 'submitted';
  confirmationMessage: string;
  email?: {
    sent: boolean;
    id?: string;
    reason?: string;
  };
  createdAt: string;
  nextStepUrl: string;
};

const applications: ApplicationRecord[] = [];
const emailService = new EmailService();

const getApplicantEmail = (applicant: ApplicantProfile, resume?: ResumePayload) =>
  applicant.email || resume?.parsedData?.email || 'preview@swipeconnect.app';

const getApplicantName = (applicant: ApplicantProfile, resume?: ResumePayload) =>
  applicant.name || resume?.parsedData?.name || 'SwipeConnect Candidate';

export class ApplicationService {
  async queueApplication(params: {
    job: NormalizedJob;
    applicant: ApplicantProfile;
    resume?: ResumePayload;
  }): Promise<ApplicationRecord> {
    const createdAt = new Date().toISOString();
    const applicantName = getApplicantName(params.applicant, params.resume);
    const applicantEmail = getApplicantEmail(params.applicant, params.resume);

    const email = await emailService.sendApplicationConfirmation({
      to: applicantEmail,
      applicantName,
      jobTitle: params.job.title,
      company: params.job.company,
      applicationUrl: params.job.applicationUrl,
    });

    const record: ApplicationRecord = {
      id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      job: params.job,
      applicant: {
        ...params.applicant,
        name: applicantName,
        email: applicantEmail,
      },
      resumeSnapshot: params.resume,
      status: 'needs-review',
      confirmationMessage: email.sent
        ? `Confirmation sent to ${applicantEmail}: ${applicantName}, your application for ${params.job.title} at ${params.job.company} is queued.`
        : `Confirmation prepared for ${applicantEmail}: ${applicantName}, your application for ${params.job.title} at ${params.job.company} is queued.`,
      email,
      createdAt,
      nextStepUrl: params.job.applicationUrl,
    };

    applications.unshift(record);
    console.log(`[Application queued] ${record.confirmationMessage}`);
    if (!email.sent) {
      console.log(`[Application email not sent] ${email.reason}`);
    }
    console.log(`[Application next step] ${record.nextStepUrl}`);
    return record;
  }

  async listApplications(applicantEmail?: string | null): Promise<ApplicationRecord[]> {
    if (!applicantEmail) return applications;
    return applications.filter((application) => application.applicant.email === applicantEmail);
  }
}
