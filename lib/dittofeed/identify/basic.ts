import { createIdentify } from "./send";

export type BasicTraits = {
  email?: string;
  firstName?: string;
  lastName?: string;
};

export const identifyBasic = createIdentify();

export async function sendBasicIdentify(userId: string, traits: BasicTraits) {
  return identifyBasic({
    userId,
    traits,
  });
}

