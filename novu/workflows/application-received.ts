import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const applicationReceived = workflow(
  'application-received',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = 'Başvuru Alındı';
        const body = `Merhaba ${payload.studentName}, ${payload.schoolName} okuluna yaptığınız ${payload.sport} başvurusu alınmıştır.`;
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
          subject: 'Başvuru Alındı',
          body: `Merhaba ${payload.studentName}, ${payload.schoolName} okuluna yaptığınız ${payload.sport} başvurusu alınmıştır.`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `Merhaba ${payload.studentName}, ${payload.schoolName} okuluna yaptığınız ${payload.sport} başvurusu alınmıştır.`,
        };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(), schoolName: z.string(), sport: z.string(),
    }),
  }
);
