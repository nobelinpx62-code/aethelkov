import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="168" height="28" viewBox="0 0 168 28" fill="none">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f2fe"/>
        <stop offset="100%" stop-color="#4facfe"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
    <rect width="168" height="28" rx="7" fill="url(#bg)" stroke="#1e293b" stroke-width="1"/>
    <circle cx="16" cy="14" r="5" fill="none" stroke="url(#cyanGrad)" stroke-width="1.5" filter="url(#glow)"/>
    <circle cx="16" cy="14" r="2.2" fill="#00f2fe"/>
    <text x="32" y="18" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="10.5" font-weight="500" letter-spacing="0.3">hosted on</text>
    <text x="88" y="18" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">Aethel Cloud</text>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

