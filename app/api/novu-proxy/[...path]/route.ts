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

// Headers to skip when forwarding
const SKIP_HEADERS = new Set([
  'host', 'connection', 'transfer-encoding', 'keep-alive',
  'origin', 'referer', 'cookie', 'set-cookie',
  'content-length', 'accept-encoding' // Let fetch calculate length and handle encoding
]);

async function proxyRequest(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/');
  const url = `${NOVU_API_URL}/${path}${req.nextUrl.search}`;

  // Forward ALL headers except problematic ones
  const headers = new Headers();
  for (const [key, value] of req.headers.entries()) {
    if (!SKIP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward body safely as arrayBuffer for non-GET requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) {
      fetchOptions.body = buf;
    }
  }

  try {
    const res = await fetch(url, fetchOptions);
    
    // Forward response headers
    const responseHeaders = new Headers();
    for (const [key, value] of res.headers.entries()) {
      if (!SKIP_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }

    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('[Novu Proxy Error]', url, error.message);
    return NextResponse.json({ error: 'Proxy error', detail: error.message }, { status: 502 });
  }
}
