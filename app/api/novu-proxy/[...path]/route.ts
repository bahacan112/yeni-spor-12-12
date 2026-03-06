import { NextRequest, NextResponse } from 'next/server';

const NOVU_API_URL = process.env.NOVU_API_URL || 'https://novu-api.mysportschool.com';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

async function proxyRequest(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/');
  const url = `${NOVU_API_URL}/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  // Forward relevant headers
  for (const [key, value] of req.headers.entries()) {
    if (['content-type', 'authorization', 'novu-client-version', 'sentry-trace', 'baggage'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward body for non-GET requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = await req.text();
  }

  try {
    const res = await fetch(url, fetchOptions);
    const data = await res.text();

    return new NextResponse(data, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[Novu Proxy Error]', error.message);
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}
