import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const duesReminder = workflow(
  'dues-reminder',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = 'Aidat Hatırlatması';
        const body = `Sayın ${payload.studentName}, ${payload.amount} ₺ tutarındaki aidat ödemeniz için son gün: ${payload.dueDate}`;
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
          subject: 'Aidat Hatırlatması',
          body: `Sayın ${payload.studentName}, ${payload.amount} ₺ tutarındaki aidat ödemeniz için son gün: ${payload.dueDate}`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `Sayın ${payload.studentName}, ${payload.amount} ₺ tutarındaki aidat ödemeniz için son gün: ${payload.dueDate}`,
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
