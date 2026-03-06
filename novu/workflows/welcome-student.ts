import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const welcomeStudent = workflow(
  'welcome-student',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = 'Hoş Geldiniz';
        const body = `Merhaba ${payload.studentName}, ${payload.schoolName} ailesine hoş geldiniz!`;
        return { 
          subject, 
          body: renderEmailHtml({ subject, body }) 
        };
      }
    );

    // 2. Push Notification (Firebase)
    await step.push(
      'send-push',
      async () => {
        return {
          subject: 'Hoş Geldiniz',
          body: `Merhaba ${payload.studentName}, ${payload.schoolName} ailesine hoş geldiniz!`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `Merhaba ${payload.studentName}, ${payload.schoolName} ailesine hoş geldiniz!`,
        };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(), schoolName: z.string(),
    }),
  }
);
