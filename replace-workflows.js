const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, 'novu', 'workflows');

const workflows = [
    {
        name: 'custom-message.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const customMessage = workflow(
  'custom-message',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: payload.subject,
          body: renderEmailHtml({ subject: payload.subject, body: payload.message }),
        };
      }
    );
  },
  {
    payloadSchema: z.object({
      subject: z.string(),
      message: z.string(),
    }),
  }
);
`
    },
    {
        name: 'dues-reminder.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const duesReminder = workflow(
  'dues-reminder',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        const subject = 'Aidat Ödeme Hatırlatması';
        const body = \`Sayın \${payload.studentName},<br><br>Bu ayki aidatınız (\${payload.amount} ₺) \${payload.dueDate} tarihine kadar ödenmelidir.<br><br>Göstermiş olduğunuz ilgiye teşekkür ederiz.\`;
        return { subject, body: renderEmailHtml({ subject, body }) };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(),
      amount: z.number(),
      dueDate: z.string(),
    }),
  }
);
`
    },
    {
        name: 'dues-overdue.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const duesOverdue = workflow(
  'dues-overdue',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        const subject = 'Gecikmiş Aidat Bildirimi';
        const body = \`Sayın \${payload.studentName},<br><br>\${payload.dueDate} tarihli \${payload.amount} ₺ tutarındaki aidat ödemeniz gecikmiştir. Lütfen en kısa sürede ödemenizi gerçekleştiriniz.\`;
        return { subject, body: renderEmailHtml({ subject, body }) };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(),
      amount: z.number(),
      dueDate: z.string(),
    }),
  }
);
`
    },
    {
        name: 'application-received.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const applicationReceived = workflow(
  'application-received',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        const subject = 'Başvurunuz Alındı';
        const body = \`Merhaba \${payload.studentName},<br><br>\${payload.schoolName} okuluna \${payload.sport} branşı için yaptığınız başvuru başarıyla tarafımıza ulaşmıştır.<br><br>En kısa sürede değerlendirilip size dönüş yapılacaktır.\`;
        return { subject, body: renderEmailHtml({ subject, body }) };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(),
      schoolName: z.string(),
      sport: z.string(),
    }),
  }
);
`
    },
    {
        name: 'payment-received.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const paymentReceived = workflow(
  'payment-received',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        const subject = 'Ödemeniz Alındı';
        const body = \`Sayın \${payload.studentName},<br><br>\${payload.paymentDate} tarihinde \${payload.amount} ₺ tutarında ödemeniz başarıyla alınmıştır. Teşekkür ederiz.\`;
        return { subject, body: renderEmailHtml({ subject, body }) };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(),
      amount: z.number(),
      paymentDate: z.string(),
    }),
  }
);
`
    },
    {
        name: 'welcome-student.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const welcomeStudent = workflow(
  'welcome-student',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        const subject = 'Aramıza Hoş Geldiniz!';
        const body = \`Merhaba \${payload.studentName},<br><br>\${payload.schoolName} ailesine hoş geldiniz! Sizinle spor dolu günlerde buluşmak için sabırsızlanıyoruz.\`;
        return { subject, body: renderEmailHtml({ subject, body }) };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(),
      schoolName: z.string(),
    }),
  }
);
`
    },
    {
        name: 'training-cancelled.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const trainingCancelled = workflow(
  'training-cancelled',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        const subject = 'Antrenman İptali Bilgilendirmesi';
        const body = \`Sayın \${payload.studentName},<br><br>\${payload.date} tarihinde saat \${payload.time} itibariyle planlanan antrenmanımız iptal edilmiştir.<br><br>Telafi programı ile ilgili sizlere ayrıca bilgi verilecektir.\`;
        return { subject, body: renderEmailHtml({ subject, body }) };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(),
      date: z.string(),
      time: z.string(),
    }),
  }
);
`
    },
    {
        name: 'training-reminder.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const trainingReminder = workflow(
  'training-reminder',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        const subject = 'Antrenman Hatırlatması';
        const body = \`Sayın \${payload.studentName},<br><br>\${payload.date} tarihinde saat \${payload.time} itibariyle antrenmanınız bulunmaktadır. Lütfen zamanında sahada/salonda olmaya özen gösteriniz.\`;
        return { subject, body: renderEmailHtml({ subject, body }) };
      }
    );
  },
  {
    payloadSchema: z.object({
      studentName: z.string(),
      date: z.string(),
      time: z.string(),
    }),
  }
);
`
    },
    {
        name: 'reservation-confirmed.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const reservationConfirmed = workflow(
  'reservation-confirmed',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        const subject = 'Rezervasyon Onayı';
        const body = \`Sayın Müşterimiz,<br><br>\${payload.venueName} için \${payload.date} \${payload.time} tarihli rezervasyon talebiniz başarıyla TEYİT EDİLMİŞTİR.<br><br>İyi antrenmanlar dileriz!\`;
        return { subject, body: renderEmailHtml({ subject, body }) };
      }
    );
  },
  {
    payloadSchema: z.object({
      venueName: z.string(),
      date: z.string(),
      time: z.string(),
    }),
  }
);
`
    },
    {
        name: 'reservation-cancelled.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const reservationCancelled = workflow(
  'reservation-cancelled',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        const subject = 'Rezervasyon İptali';
        const body = \`Sayın Müşterimiz,<br><br>\${payload.venueName} tesisindeki \${payload.date} \${payload.time} tarihli rezervasyonunuz İPTAL edilmiştir.<br><br>Varsa iade süreciniz başlatılacaktır.\`;
        return { subject, body: renderEmailHtml({ subject, body }) };
      }
    );
  },
  {
    payloadSchema: z.object({
      venueName: z.string(),
      date: z.string(),
      time: z.string(),
    }),
  }
);
`
    },
    {
        name: 'announcement.ts',
        content: `import { renderEmailHtml } from './email-template';
import { workflow } from '@novu/framework';
import { z } from 'zod';

export const announcement = workflow(
  'announcement',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        const subject = payload.subject;
        const body = \`Sayın Velimiz/Öğrencimiz,<br><br>\${payload.message}\`;
        return { subject, body: renderEmailHtml({ subject, body }) };
      }
    );
  },
  {
    payloadSchema: z.object({
      subject: z.string(),
      message: z.string(),
    }),
  }
);
`
    }
];

workflows.forEach(w => {
    fs.writeFileSync(path.join(workflowsDir, w.name), w.content);
});
console.log('Done recreating files');
