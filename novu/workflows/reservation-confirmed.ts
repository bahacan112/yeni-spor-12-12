import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const reservationConfirmed = workflow(
  'reservation-confirmed',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = 'Rezervasyon Onayı';
        const body = `${payload.venueName} için ${payload.date} ${payload.time} rezervasyonunuz onaylanmıştır.`;
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
          subject: 'Rezervasyon Onayı',
          body: `${payload.venueName} için ${payload.date} ${payload.time} rezervasyonunuz onaylanmıştır.`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `${payload.venueName} için ${payload.date} ${payload.time} rezervasyonunuz onaylanmıştır.`,
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
