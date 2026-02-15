import { createEvent } from "./send";

export type TestEmailProps = {
  to: string;
  email?: string;
  subject?: string;
  content?: string;
};

export const triggerTestEmail = createEvent("TestEmail");

export async function sendTestEmail(userId: string, props: TestEmailProps) {
  return triggerTestEmail({
    userId,
    properties: {
      to: props.to,
      email: props.email || props.to,
      subject: props.subject,
      content: props.content,
    },
  });
}

