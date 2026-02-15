import { getDittofeedWrite } from "@/lib/integrations/dittofeed";
import { randomMessageId, sanitizeUserId } from "../utils";

export type IdentifyInput = {
  userId: string;
  traits?: Record<string, any>;
};

export async function sendIdentify(input: IdentifyInput) {
  const write = getDittofeedWrite();
  const userId = sanitizeUserId(input.userId);
  return write.identify({
    userId,
    traits: input.traits,
    messageId: randomMessageId(),
  });
}

export function createIdentify(defaultTraits?: Record<string, any>) {
  return async (input: IdentifyInput) =>
    sendIdentify({
      userId: input.userId,
      traits: { ...(defaultTraits || {}), ...(input.traits || {}) },
    });
}
