const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, 'novu', 'workflows');

const workflows = [
    {
        id: 'custom-message',
        name: 'custom-message.ts',
        title: 'Yeni Mesaj',
        content: `Merhaba, size yeni bir mesaj gönderildi: \${payload.message}`,
        payload: `subject: z.string(), message: z.string(),`
    },
    {
        id: 'dues-reminder',
        name: 'dues-reminder.ts',
        title: 'Aidat Hatırlatması',
        content: `Sayın \${payload.studentName}, \${payload.amount} ₺ tutarındaki aidat ödemeniz için son gün: \${payload.dueDate}`,
        payload: `studentName: z.string(), amount: z.number(), dueDate: z.string(),`
    },
    {
        id: 'dues-overdue',
        name: 'dues-overdue.ts',
        title: 'Gecikmiş Aidat',
        content: `Sayın \${payload.studentName}, \${payload.amount} ₺ tutarındaki aidat ödemeniz gecikmiştir. Lütfen kontrol ediniz.`,
        payload: `studentName: z.string(), amount: z.number(), dueDate: z.string(),`
    },
    {
        id: 'application-received',
        name: 'application-received.ts',
        title: 'Başvuru Alındı',
        content: `Merhaba \${payload.studentName}, \${payload.schoolName} okuluna yaptığınız \${payload.sport} başvurusu alınmıştır.`,
        payload: `studentName: z.string(), schoolName: z.string(), sport: z.string(),`
    },
    {
        id: 'payment-received',
        name: 'payment-received.ts',
        title: 'Ödeme Onayı',
        content: `Sayın \${payload.studentName}, \${payload.amount} ₺ tutarındaki ödemeniz başarıyla alınmıştır.`,
        payload: `studentName: z.string(), amount: z.number(), paymentDate: z.string(),`
    },
    {
        id: 'welcome-student',
        name: 'welcome-student.ts',
        title: 'Hoş Geldiniz',
        content: `Merhaba \${payload.studentName}, \${payload.schoolName} ailesine hoş geldiniz!`,
        payload: `studentName: z.string(), schoolName: z.string(),`
    },
    {
        id: 'training-cancelled',
        name: 'training-cancelled.ts',
        title: 'Antrenman İptali',
        content: `\${payload.date} \${payload.time} tarihindeki antrenman iptal edilmiştir.`,
        payload: `studentName: z.string().optional(), date: z.string(), time: z.string(),`
    },
    {
        id: 'training-reminder',
        name: 'training-reminder.ts',
        title: 'Antrenman Hatırlatması',
        content: `Bugün saat \${payload.time} antrenmanınız bulunmaktadır.`,
        payload: `studentName: z.string().optional(), date: z.string(), time: z.string(),`
    },
    {
        id: 'reservation-confirmed',
        name: 'reservation-confirmed.ts',
        title: 'Rezervasyon Onayı',
        content: `\${payload.venueName} için \${payload.date} \${payload.time} rezervasyonunuz onaylanmıştır.`,
        payload: `studentName: z.string().optional(), venueName: z.string(), date: z.string(), time: z.string(),`
    },
    {
        id: 'reservation-cancelled',
        name: 'reservation-cancelled.ts',
        title: 'Rezervasyon İptali',
        content: `\${payload.venueName} için olan rezervasyonunuz iptal edilmiştir.`,
        payload: `studentName: z.string().optional(), venueName: z.string(), date: z.string(), time: z.string(),`
    },
    {
        id: 'announcement',
        name: 'announcement.ts',
        title: 'Duyuru',
        content: `Yeni bir duyuru var: \${payload.subject}`,
        payload: `subject: z.string(), message: z.string(),`
    }
];

// Re-generate all files with multi-channel support
workflows.forEach(w => {
    const varName = w.id.replace(/-([a-z])/g, g => g[1].toUpperCase());
    const subjectCode = (w.id === 'custom-message' || w.id === 'announcement') ? 'payload.subject' : `'${w.title}'`;
    
    // Using string template here but ensuring the output file has literal ${payload...}
    const workflowCode = `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const ${varName} = workflow(
  '${w.id}',
  async ({ step, payload }) => {
    // 1. Email (Resend)
    await step.email(
      'send-email',
      async () => {
        const subject = ${subjectCode};
        const body = \`${w.content}\`;
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
          title: ${subjectCode},
          body: \`${w.content.replace(/<br>/g, ' ')}\`,
        };
      }
    );

    // 3. In-App Notification (Novu Inbox)
    await step.inApp(
      'send-in-app',
      async () => {
        return {
          body: \`${w.content.replace(/<br>/g, ' ')}\`,
        };
      }
    );
  },
  {
    payloadSchema: z.object({
      ${w.payload}
    }),
  }
);
`;
    fs.writeFileSync(path.join(workflowsDir, w.name), workflowCode);
});
console.log('Update complete');
