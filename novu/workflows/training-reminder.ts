import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const trainingReminder = workflow(
  'training-reminder',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = 'Antrenman Hatırlatması';
        const body = `Bugün saat ${payload.time} antrenmanınız bulunmaktadır.`;
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
          subject: 'Antrenman Hatırlatması',
          body: `Bugün saat ${payload.time} antrenmanınız bulunmaktadır.`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `Bugün saat ${payload.time} antrenmanınız bulunmaktadır.`,
        };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string().optional(), date: z.string(), time: z.string(),
    }),
  }
);
