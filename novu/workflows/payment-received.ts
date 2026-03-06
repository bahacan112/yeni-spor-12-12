import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const paymentReceived = workflow(
  'payment-received',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = 'Ödeme Onayı';
        const body = `Sayın ${payload.studentName}, ${payload.amount} ₺ tutarındaki ödemeniz başarıyla alınmıştır.`;
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
          subject: 'Ödeme Onayı',
          body: `Sayın ${payload.studentName}, ${payload.amount} ₺ tutarındaki ödemeniz başarıyla alınmıştır.`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: `Sayın ${payload.studentName}, ${payload.amount} ₺ tutarındaki ödemeniz başarıyla alınmıştır.`,
        };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(), amount: z.number(), paymentDate: z.string(),
    }),
  }
);
