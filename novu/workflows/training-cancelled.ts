import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const trainingCancelled = workflow(
  'training-cancelled',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = 'Antrenman İptali';
        const body = `${payload.date} ${payload.time} tarihindeki antrenman iptal edilmiştir.`;
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
          subject: 'Antrenman İptali',
          body: `${payload.date} ${payload.time} tarihindeki antrenman iptal edilmiştir.`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `${payload.date} ${payload.time} tarihindeki antrenman iptal edilmiştir.`,
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
