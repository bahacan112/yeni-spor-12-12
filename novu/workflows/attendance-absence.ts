import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const attendanceAbsence = workflow(
  'attendance-absence',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = 'Devamsızlık Bildirimi';
        const body = `Sayın Veli, ${payload.studentName} adlı öğrencimiz ${payload.date} tarihinde ${payload.trainingTitle} antrenmanına katılım sağlamamıştır. Bilginize sunarız.`;
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
          subject: 'Devamsızlık Bildirimi',
          body: `${payload.studentName}, ${payload.date} tarihli ${payload.trainingTitle} antrenmanına katılmadı.`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `${payload.studentName}, ${payload.date} tarihli ${payload.trainingTitle} antrenmanına katılmadı.`,
        };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(),
      trainingTitle: z.string(),
      date: z.string(),
      time: z.string().optional(),
    }),
  }
);
