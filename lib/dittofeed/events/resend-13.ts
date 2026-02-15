import { createEvent } from "./send";

export type Resend13Props = {
  userid: string;
  email: string;
  to?: string;
  subject?: string;
  content?: string;
};

export const triggerResend13 = createEvent("13");

export async function sendResend13(userId: string, props: Resend13Props) {
  return triggerResend13({
    userId,
    properties: {
      userid: props.userid,
      email: props.email,
      to: props.to || props.email,
      subject: props.subject,
      content: props.content,
    },
  });
}

