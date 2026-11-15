import { NextRequest, NextResponse } from 'next/server';
import { saveAppEnvVars, loadAppEnvVars } from '@/lib/envVarsService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id;
    const vars = await loadAppEnvVars(appId);
    return NextResponse.json({ success: true, vars });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar variáveis.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id;
    const body = await req.json();
    const { vars, botName } = body;

    if (!vars || typeof vars !== 'object') {
      return NextResponse.json({ error: 'Formato de variáveis inválido.' }, { status: 400 });
    }

    const result = await saveAppEnvVars(appId, vars, botName);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Variáveis sincronizadas com sucesso!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao salvar variáveis.' }, { status: 500 });
  }
}
