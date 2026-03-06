import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const customMessage = workflow(
  'custom-message',
  async ({ step, payload }) => {
    const channel = payload.channel || 'all'; // 'all' | 'email' | 'push' | 'in_app'

    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = payload.subject;
        const body = `Merhaba, size yeni bir mesaj gönderildi: ${payload.message}`;
        return { 
          subject, 
          body: renderEmailHtml({ subject, body }) 
        };
      },
      { skip: () => channel !== 'all' && channel !== 'email' }
    );

    // 2. Push Notification (Firebase)
    await step.push(
      'send-push',
      async () => {
        return {
          subject: payload.subject,
          body: `Merhaba, size yeni bir mesaj gönderildi: ${payload.message}`,
        };
      },
      { skip: () => channel !== 'all' && channel !== 'push' }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `Merhaba, size yeni bir mesaj gönderildi: ${payload.message}`,
        };
      },
      { skip: () => channel !== 'all' && channel !== 'in_app' }
    );
  },
  {
    payloadSchema: z.object({
      subject: z.string(),
      message: z.string(),
      channel: z.string().optional(),
    }),
  }
);
