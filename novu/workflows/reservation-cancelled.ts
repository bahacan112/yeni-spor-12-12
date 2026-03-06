import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const reservationCancelled = workflow(
  'reservation-cancelled',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = 'Rezervasyon İptali';
        const body = `${payload.venueName} için olan rezervasyonunuz iptal edilmiştir.`;
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
          subject: 'Rezervasyon İptali',
          body: `${payload.venueName} için olan rezervasyonunuz iptal edilmiştir.`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `${payload.venueName} için olan rezervasyonunuz iptal edilmiştir.`,
        };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string().optional(), venueName: z.string(), date: z.string(), time: z.string(),
    }),
  }
);
