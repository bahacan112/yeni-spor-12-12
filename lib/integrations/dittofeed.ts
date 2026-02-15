import { NextResponse } from "next/server";

type Json = Record<string, any>;

function joinUrl(base: string, path: string) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

class DittofeedAdminClient {
  private apiUrl: string;
  private apiKey: string;
  private basePath: string;
  private workspaceId?: string;
  constructor() {
    this.apiUrl = process.env.DITTOFEED_API_URL || "";
    this.apiKey = process.env.DITTOFEED_API_KEY || "";
    this.basePath = process.env.DITTOFEED_ADMIN_BASE_PATH || "api";
    this.workspaceId = process.env.DITTOFEED_WORKSPACE_ID || undefined;
    if (!this.apiUrl || !this.apiKey) {
      throw new Error("DITTOFEED_API_URL ve DITTOFEED_API_KEY gerekli");
    }
  }
  private headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "x-api-key": this.apiKey,
    };
  }
  async request<T = any>(
    method: string,
    path: string,
    body?: Json
  ): Promise<T> {
    const url = joinUrl(this.apiUrl, joinUrl(this.basePath, path));
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    if (!res.ok) {
      const err = isJson
        ? await res.json().catch(() => ({}))
        : await res.text();
      throw new Error(
        typeof err === "string"
          ? err
          : String(
              (err && (err.error || err.message)) || "Dittofeed admin hatası"
            )
      );
    }
    return (isJson ? await res.json() : await res.text()) as T;
  }
  async listActions(): Promise<any> {
    return this.request("GET", "actions");
  }
  async createAction(input: {
    key: string;
    name?: string;
    description?: string;
    conditions?: Json;
    steps?: Json[];
    metadata?: Json;
  }): Promise<any> {
    return this.request("POST", "actions", input);
  }
  async updateAction(id: string, patch: Json): Promise<any> {
    return this.request("PATCH", `actions/${encodeURIComponent(id)}`, patch);
  }
  async listJourneys(): Promise<any> {
    return this.request("GET", "admin/journeys");
  }
  async createJourney(input: {
    key: string;
    name?: string;
    description?: string;
    conditions?: Json;
    steps?: Json[];
    metadata?: Json;
  }): Promise<any> {
    return this.request("POST", "admin/journeys", input);
  }
  async listEmailProviders(): Promise<any> {
    return this.request("GET", "settings/email-providers");
  }
  async configureSmtp(input: {
    host: string;
    port: number;
    secure?: boolean;
    username: string;
    password: string;
    from?: string;
    fromName?: string;
    setDefault?: boolean;
  }): Promise<any> {
    const body: any = {
      config: {
        type: "SMTP",
        host: input.host,
        port: input.port,
        secure: !!input.secure,
        username: input.username,
        password: input.password,
        from: input.from,
        fromName: input.fromName,
      },
      setDefault: !!input.setDefault,
    };
    if (this.workspaceId) {
      body.workspaceId = this.workspaceId;
    }
    return this.request("PUT", "settings/email-providers", body);
  }
}

class DittofeedWriteClient {
  private writeUrl: string;
  private writeKey: string;
  constructor() {
    this.writeUrl = process.env.DITTOFEED_WRITE_URL || "";
    this.writeKey = process.env.DITTOFEED_WRITE_KEY || "";
    if (!this.writeUrl || !this.writeKey) {
      throw new Error("DITTOFEED_WRITE_URL ve DITTOFEED_WRITE_KEY gerekli");
    }
  }
  private headers(): HeadersInit {
    const val = this.writeKey.trim();
    const auth = val.startsWith("Basic ") ? val : `Basic ${val}`;
    return {
      "Content-Type": "application/json",
      Authorization: auth,
    };
  }
  async identify(input: {
    userId: string;
    traits?: Json;
    context?: Json;
    timestamp?: string;
    messageId?: string;
  }): Promise<any> {
    const url = joinUrl(this.writeUrl, "api/public/apps/identify");
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(input),
    });
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    if (!res.ok) {
      const err = isJson
        ? await res.json().catch(() => ({}))
        : await res.text();
      throw new Error(
        typeof err === "string"
          ? err
          : String(
              (err && (err.error || err.message)) || "Dittofeed write hatası"
            )
      );
    }
    return (isJson ? await res.json() : await res.text()) as any;
  }
  async track(input: {
    userId: string;
    event: string;
    properties?: Json;
    context?: Json;
    timestamp?: string;
    messageId?: string;
  }): Promise<any> {
    const url = joinUrl(this.writeUrl, "api/public/apps/track");
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(input),
    });
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    if (!res.ok) {
      const err = isJson
        ? await res.json().catch(() => ({}))
        : await res.text();
      throw new Error(
        typeof err === "string"
          ? err
          : String(
              (err && (err.error || err.message)) || "Dittofeed write hatası"
            )
      );
    }
    return (isJson ? await res.json() : await res.text()) as any;
  }
}

let adminClient: DittofeedAdminClient | null = null;
let writeClient: DittofeedWriteClient | null = null;

export function getDittofeedAdmin() {
  if (!adminClient) adminClient = new DittofeedAdminClient();
  return adminClient;
}

export function getDittofeedWrite() {
  if (!writeClient) writeClient = new DittofeedWriteClient();
  return writeClient;
}
