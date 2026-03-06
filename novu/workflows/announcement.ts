import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const announcement = workflow(
  'announcement',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = payload.subject;
        const body = `Yeni bir duyuru var: ${payload.subject}`;
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
          subject: payload.subject,
          body: `Yeni bir duyuru var: ${payload.subject}`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `Yeni bir duyuru var: ${payload.subject}`,
        };
      }
    );
  },
  {
    payloadSchema: z.object({
      subject: z.string(), message: z.string(),
    }),
  }
);
