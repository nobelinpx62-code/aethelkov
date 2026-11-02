import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateApiRequest } from '@/lib/serverApiAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/app
 * Lista todas as aplicações ativas da conta na malha Aethel
 * Estilo Discloud: https://api.discloud.app/v2/app/all
 */
export async function GET(req: NextRequest) {
  const auth = authenticateApiRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  try {
    const { data: bots, error } = await supabase
      .from('aethel_bots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { status: 'error', statusCode: 500, message: error.message },
        { status: 500 }
      );
    }

    const formattedApps = (bots || []).map((bot) => ({
      id: bot.id,
      name: bot.bot_name,
      online: bot.status === 'ONLINE',
      status: bot.status,
      ram: Math.max(bot.ram_limit_mb || 100, 100),
      main: bot.main_file || 'bot.js',
      version: 'latest',
      platform: bot.platform,
      lang: 'javascript',
      node: bot.assigned_node || 'farol-alpha',
      configType: bot.config_type || 'discloud',
      container: 'aethel-micro-vm',
      createdAt: bot.created_at,
      lastRestart: bot.last_restart_at || bot.updated_at || bot.created_at,
    }));

    return NextResponse.json({
      status: 'ok',
      statusCode: 200,
      apps: formattedApps,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', statusCode: 500, message: err.message },
      { status: 500 }
    );
  }
}

