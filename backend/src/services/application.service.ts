import { IJob } from '../models/Job';
import { IUser } from '../models/User';
import puppeteer from 'puppeteer';
import { parseResume } from './resume-parser.service';

export class ApplicationService {
  async applyToJob(job: IJob, user: IUser): Promise<boolean> {
    try {
      // Parse user's resume
      const resume = await parseResume(user.resume);

      // Launch browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // Navigate to application URL
      await page.goto(job.applicationUrl, { waitUntil: 'networkidle0' });

      // Fill in application form
      await this.fillApplicationForm(page, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        resume,
        experience: user.experience,
        education: user.education,
      });

      // Submit application
      await page.click('button[type="submit"]');
      await page.waitForNavigation();

      // Check if application was successful
      const success = await this.checkApplicationSuccess(page);

      await browser.close();
      return success;
    } catch (error) {
      console.error('Error applying to job:', error);
      throw error;
    }
  }

  private async fillApplicationForm(
    page: puppeteer.Page,
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      resume: any;
      experience: any[];
      education: any[];
    }
  ) {
    // Fill personal information
    await page.type('input[name="firstName"]', data.firstName);
    await page.type('input[name="lastName"]', data.lastName);
    await page.type('input[name="email"]', data.email);
    await page.type('input[name="phone"]', data.phone);

    // Upload resume
    const resumeInput = await page.$('input[type="file"]');
    if (resumeInput) {
      await resumeInput.uploadFile(data.resume.path);
    }

    // Fill experience
    for (let i = 0; i < data.experience.length; i++) {
      const exp = data.experience[i];
      await page.type(`input[name="experience[${i}].company"]`, exp.company);
      await page.type(`input[name="experience[${i}].title"]`, exp.title);
      await page.type(`input[name="experience[${i}].startDate"]`, exp.startDate);
      await page.type(`input[name="experience[${i}].endDate"]`, exp.endDate);
      await page.type(`textarea[name="experience[${i}].description"]`, exp.description);
    }

    // Fill education
    for (let i = 0; i < data.education.length; i++) {
      const edu = data.education[i];
      await page.type(`input[name="education[${i}].school"]`, edu.school);
      await page.type(`input[name="education[${i}].degree"]`, edu.degree);
      await page.type(`input[name="education[${i}].field"]`, edu.field);
      await page.type(`input[name="education[${i}].graduationDate"]`, edu.graduationDate);
    }
  }

  private async checkApplicationSuccess(page: puppeteer.Page): Promise<boolean> {
    // Check for success message or confirmation
    const successText = await page.evaluate(() => {
      const successElement = document.querySelector('.success-message, .confirmation-message');
      return successElement ? successElement.textContent : null;
    });

    return !!successText;
  }
} 