import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateApiRequest } from '@/lib/serverApiAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/user
 * Retorna os dados cadastrais, plano e telemetria da conta Aethel Cloud
 * Estilo Discloud: https://api.discloud.app/v2/user
 */
export async function GET(req: NextRequest) {
  const auth = authenticateApiRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  try {
    const { data: bots } = await supabase
      .from('aethel_bots')
      .select('id, bot_name, ram_limit_mb, status');

    const totalApps = bots?.length || 0;
    const onlineApps = bots?.filter((b) => b.status === 'ONLINE').length || 0;
    const totalRamQuotaMb = 100;
    const ramUsedMb = (bots || []).reduce((sum, b) => sum + Math.max(b.ram_limit_mb || 100, 100), 0);
    const ramFreeMb = Math.max(0, totalRamQuotaMb - ramUsedMb);

    return NextResponse.json({
      status: 'ok',
      statusCode: 200,
      message: 'Dados da conta Aethel Cloud obtidos com sucesso',
      user: {
        userID: 'aethel-account',
        totalRamMb: totalRamQuotaMb,
        ramUsedMb,
        ramFreeMb,
        plan: 'Aethel Free Mesh (100 MB Cota Estrita)',
        locale: 'pt-BR',
        apps: (bots || []).map((b) => b.id),
        totalApps,
        onlineApps,
        clusters: ['farol-alpha'],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', statusCode: 500, message: err.message },
      { status: 500 }
    );
  }
}

