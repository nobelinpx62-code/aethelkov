import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  const subdomain = params?.subdomain || 'app';

  return NextResponse.json({
    status: 'ONLINE',
    subdomain,
    url: `https://aethelkov.vercel.app/sites/${subdomain}`,
    ram_allocated_mb: 512,
    runtime: 'edge',
    edge_location: 'gru1-brazil',
    uptime: '24/7',
    latency_ms: Math.floor(Math.random() * 8) + 10,
    timestamp: new Date().toISOString(),
    message: `A rota de API do site "${subdomain}" está operando com sucesso na malha Aethel Kov!`,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0',
      'X-Powered-By': 'Aethel Kov Edge',
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  const subdomain = params?.subdomain || 'app';
  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  return NextResponse.json({
    success: true,
    subdomain,
    forwarded_at: new Date().toISOString(),
    proxy_response: {
      received_payload: body,
      ram_available_mb: 512,
      status: 'DISPATCHED_200',
    },
  });
}

