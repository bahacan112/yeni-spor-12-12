const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, 'novu', 'workflows');
if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
}

const workflows = [
    {
        name: 'custom-message.ts',
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const customMessage = workflow(
  'custom-message',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: payload.subject,
          body: payload.message,
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
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const duesReminder = workflow(
  'dues-reminder',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: 'Aidat Ödeme Hatırlatması',
          body: \`Sayın \${payload.studentName},<br><br>Bu ayki aidatınız (\${payload.amount} ₺) \${payload.dueDate} tarihine kadar ödenmelidir.<br><br>Göstermiş olduğunuz ilgiye teşekkür ederiz.\`,
        };
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
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const duesOverdue = workflow(
  'dues-overdue',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: 'Gecikmiş Aidat Bildirimi',
          body: \`Sayın \${payload.studentName},<br><br>\${payload.dueDate} tarihli \${payload.amount} ₺ tutarındaki aidat ödemeniz gecikmiştir. Lütfen en kısa sürede ödemenizi gerçekleştiriniz.\`,
        };
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
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const applicationReceived = workflow(
  'application-received',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: 'Başvurunuz Alındı',
          body: \`Merhaba \${payload.studentName},<br><br>\${payload.schoolName} okuluna \${payload.sport} branşı için yaptığınız başvuru başarıyla tarafımıza ulaşmıştır.<br><br>En kısa sürede değerlendirilip size dönüş yapılacaktır.\`,
        };
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
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const paymentReceived = workflow(
  'payment-received',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: 'Ödemeniz Alındı',
          body: \`Sayın \${payload.studentName},<br><br>\${payload.paymentDate} tarihinde \${payload.amount} ₺ tutarında ödemeniz başarıyla alınmıştır. Teşekkür ederiz.\`,
        };
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
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const welcomeStudent = workflow(
  'welcome-student',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: 'Aramıza Hoş Geldiniz!',
          body: \`Merhaba \${payload.studentName},<br><br>\${payload.schoolName} ailesine hoş geldiniz! Sizinle spor dolu günlerde buluşmak için sabırsızlanıyoruz.\`,
        };
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
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const trainingCancelled = workflow(
  'training-cancelled',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: 'Antrenman İptali Bilgilendirmesi',
          body: \`Sayın \${payload.studentName},<br><br>\${payload.date} tarihinde saat \${payload.time} itibariyle planlanan antrenmanımız iptal edilmiştir.<br><br>Telafi programı ile ilgili sizlere ayrıca bilgi verilecektir.\`,
        };
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
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const trainingReminder = workflow(
  'training-reminder',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: 'Antrenman Hatırlatması',
          body: \`Sayın \${payload.studentName},<br><br>\${payload.date} tarihinde saat \${payload.time} itibariyle antrenmanınız bulunmaktadır. Lütfen zamanında sahada/salonda olmaya özen gösteriniz.\`,
        };
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
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const reservationConfirmed = workflow(
  'reservation-confirmed',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: 'Rezervasyon Onayı',
          body: \`Sayın Müşterimiz,<br><br>\${payload.venueName} için \${payload.date} \${payload.time} tarihli rezervasyon talebiniz başarıyla TEYİT EDİLMİŞTİR.<br><br>İyi antrenmanlar dileriz!\`,
        };
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
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const reservationCancelled = workflow(
  'reservation-cancelled',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: 'Rezervasyon İptali',
          body: \`Sayın Müşterimiz,<br><br>\${payload.venueName} tesisindeki \${payload.date} \${payload.time} tarihli rezervasyonunuz İPTAL edilmiştir.<br><br>Varsa iade süreciniz başlatılacaktır.\`,
        };
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
        content: `import { workflow } from '@novu/framework';
import { z } from 'zod';

export const announcement = workflow(
  'announcement',
  async ({ step, payload }) => {
    await step.email(
      'send-email',
      async () => {
        return {
          subject: payload.subject,
          body: \`Sayın Velimiz/Öğrencimiz,<br><br>\${payload.message}\`,
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
        name: 'index.ts',
        content: `export * from './custom-message';
export * from './dues-reminder';
export * from './dues-overdue';
export * from './payment-received';
export * from './application-received';
export * from './welcome-student';
export * from './training-cancelled';
export * from './training-reminder';
export * from './reservation-confirmed';
export * from './reservation-cancelled';
export * from './announcement';
`
    }
];

workflows.forEach(w => {
    fs.writeFileSync(path.join(workflowsDir, w.name), w.content);
});

const apiDir = path.join(__dirname, 'app', 'api', 'novu');
if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
}

fs.writeFileSync(path.join(apiDir, 'route.ts'), `import { serve } from '@novu/framework/next';
import {
  customMessage, duesReminder, duesOverdue, paymentReceived,
  applicationReceived, welcomeStudent, trainingCancelled,
  trainingReminder, reservationConfirmed, reservationCancelled,
  announcement
} from '../../../novu/workflows';

export const { GET, POST, OPTIONS } = serve({
  workflows: [
    customMessage, duesReminder, duesOverdue, paymentReceived,
    applicationReceived, welcomeStudent, trainingCancelled,
    trainingReminder, reservationConfirmed, reservationCancelled,
    announcement
  ],
});
`);
