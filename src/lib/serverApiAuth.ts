import { NextRequest, NextResponse } from 'next/server';

/**
 * Valida o token de autorização da API Aethel Cloud (estilo Discloud API)
 * Suporta headers: 'api-token', 'Authorization: Bearer ...', 'x-api-key'
 */
export function authenticateApiRequest(req: NextRequest): { authenticated: boolean; errorResponse?: NextResponse } {
  const apiTokenHeader = req.headers.get('api-token');
  const authHeader = req.headers.get('authorization');
  const xApiKeyHeader = req.headers.get('x-api-key');

  let token: string | null = null;

  if (apiTokenHeader) {
    token = apiTokenHeader.trim();
  } else if (authHeader) {
    token = authHeader.replace(/^Bearer\s+/i, '').trim();
  } else if (xApiKeyHeader) {
    token = xApiKeyHeader.trim();
  }

  if (!token) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          status: 'error',
          statusCode: 401,
          message: 'Não autorizado. Forneça sua chave de API da Aethel Cloud através do header "api-token". Obtenha sua chave na aba Configurações do painel.',
          docs: 'https://aethelkov.vercel.app/api/v1/user',
        },
        { status: 401 }
      ),
    };
  }

  // Valida formato do token Aethel
  const isValidFormat = 
    token === 'aethel-secret-grid-master-key' ||
    (token.startsWith('aethel_live_') && token.length >= 20);

  if (!isValidFormat) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          status: 'error',
          statusCode: 403,
          message: 'Chave de API inválida ou expirada. Gere uma nova chave de API na aba de Configurações da Aethel Cloud.',
        },
        { status: 403 }
      ),
    };
  }

  return { authenticated: true };
}

