import { createIdentify } from "./send";
import { buildUserIdFromParts } from "../utils";

export const identifyTenantAdmin = createIdentify();

export async function sendIdentifyTenantAdmin(input: {
  tenantId?: string;
  userId?: string;
  traits: {
    email?: string;
    fullName?: string;
    role?: string;
    tenantId?: string;
    tenantName?: string;
  };
}) {
  return identifyTenantAdmin({
    userId: buildUserIdFromParts("users", input.tenantId || "platform", input.userId || ""),
    traits: {
      ...(input.traits || {}),
      tenantId: input.tenantId || "platform",
      role: input.traits?.role || "tenant_admin",
    },
  });
}

export const identifySuperAdmin = createIdentify();

export async function sendIdentifySuperAdmin(input: {
  userId: string;
  traits: {
    email?: string;
    fullName?: string;
    role?: string;
  };
}) {
  return identifySuperAdmin({
    userId: buildUserIdFromParts("users", "platform", input.userId),
    traits: {
      ...(input.traits || {}),
      role: input.traits?.role || "super_admin",
    },
  });
}

