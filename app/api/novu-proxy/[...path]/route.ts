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

// Headers to explicitly drop to avoid proxy conflicts
const SKIP_HEADERS = new Set([
  'host', 
  'connection', 
  'transfer-encoding', 
  'keep-alive',
  'origin', 
  'referer', 
  'content-length', // Let the fetch API automatically calculate
  'accept-encoding' // Avoid compressed responses causing issues in the proxy
]);

async function proxyRequest(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/');
  const url = `${NOVU_API_URL}/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!SKIP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    // Provide a valid cache/duplex option for streaming/fetching
    cache: 'no-store',
  };

  // Only parse body for allowed methods
  if (!['GET', 'HEAD'].includes(req.method)) {
    try {
      const clonedReq = req.clone(); // Clone safely
      const bodyText = await clonedReq.text();
      
      if (bodyText) {
        fetchOptions.body = bodyText;
      }
    } catch (e) {
      console.error('[Novu Proxy] Body Parsing Error:', e);
    }
  }

  try {
    const res = await fetch(url, fetchOptions);
    
    // Copy the target response back to the client
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      // Don't copy over specific headers that the client fetch should handle natively
      if (!SKIP_HEADERS.has(key.toLowerCase()) && key.toLowerCase() !== 'content-encoding') {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await res.arrayBuffer();

    return new NextResponse(responseBody, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[Novu Proxy Error] ${req.method} ${url}`, error.message);
    return NextResponse.json({ error: 'Proxy Request Failed', detail: error.message }, { status: 502 });
  }
}

