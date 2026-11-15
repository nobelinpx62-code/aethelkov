import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - icon.svg
     * - badge.svg
     * - robots.txt
     * - sitemap.xml
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|badge.svg|robots.txt|sitemap.xml).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Domínios principais da plataforma (renderizam o painel e a landing page normalmente)
  const isMainDomain = 
    hostname === 'linkthelkov.online' ||
    hostname === 'www.linkthelkov.online' ||
    hostname === 'localhost:3000' ||
    hostname === '127.0.0.1:3000' ||
    hostname.endsWith('.vercel.app');

  if (isMainDomain) {
    return NextResponse.next();
  }

  // Extrai o subdomínio: ex "meuapp.linkthelkov.online" -> "meuapp"
  let subdomain = '';
  if (hostname.includes('.linkthelkov.online')) {
    subdomain = hostname.replace('.linkthelkov.online', '').toLowerCase().trim();
  } else if (hostname.includes('.localhost')) {
    subdomain = hostname.replace('.localhost:3000', '').replace('.localhost', '').toLowerCase().trim();
  }

  // Se não tiver subdomínio ou for 'www', deixa passar normal
  if (!subdomain || subdomain === 'www') {
    return NextResponse.next();
  }

  // Reescreve internamente para a rota /sites/[subdomain], mantendo a URL visível intocada
  url.pathname = `/sites/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(url);
}
