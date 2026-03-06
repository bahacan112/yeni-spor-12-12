import { serve } from '@novu/framework/next';
import {
  customMessage, duesReminder, duesOverdue, paymentReceived,
  applicationReceived, welcomeStudent, trainingCancelled,
  trainingReminder, reservationConfirmed, reservationCancelled,
  announcement, attendanceAbsence
} from '../../../novu/workflows';

export const { GET, POST, OPTIONS } = serve({
  workflows: [
    customMessage, duesReminder, duesOverdue, paymentReceived,
    applicationReceived, welcomeStudent, trainingCancelled,
    trainingReminder, reservationConfirmed, reservationCancelled,
    announcement, attendanceAbsence
  ],
});
