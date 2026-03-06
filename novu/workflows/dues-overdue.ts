import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const duesOverdue = workflow(
  'dues-overdue',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = 'Gecikmiş Aidat';
        const body = `Sayın ${payload.studentName}, ${payload.amount} ₺ tutarındaki aidat ödemeniz gecikmiştir. Lütfen kontrol ediniz.`;
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
          subject: 'Gecikmiş Aidat',
          body: `Sayın ${payload.studentName}, ${payload.amount} ₺ tutarındaki aidat ödemeniz gecikmiştir. Lütfen kontrol ediniz.`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `Sayın ${payload.studentName}, ${payload.amount} ₺ tutarındaki aidat ödemeniz gecikmiştir. Lütfen kontrol ediniz.`,
        };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(), amount: z.number(), dueDate: z.string(),
    }),
  }
);
