import { getDittofeedWrite } from "@/lib/integrations/dittofeed";
import { randomMessageId, sanitizeUserId } from "../utils";

export type EventInput = {
  userId: string;
  properties?: Record<string, any>;
};

export async function sendEvent(key: string, input: EventInput) {
  const write = getDittofeedWrite();
  const userId = sanitizeUserId(input.userId);
  return write.track({
    userId,
    event: key,
    properties: input.properties,
    messageId: randomMessageId(),
  });
}

export function createEvent(key: string) {
  return async (input: EventInput) => sendEvent(key, input);
}
